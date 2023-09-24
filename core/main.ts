import { app, BrowserWindow, dialog, shell, clipboard, Menu, ipcMain as ipc, Tray, powerMonitor as power } from "electron"
import { type, arch, release, cpus, totalmem } from "os"
import { autoUpdater } from "electron-updater"
import { date, number } from "../build.json"
import AutoLaunch = require("auto-launch")
import debug = require("electron-debug")
import { join } from "path"

/**
 * States
 */
let mainWindow: BrowserWindow
let mainWindowShown = false
let tray: Tray

/**
 * Check if running in development mode
 */
let dev = false

if (!app.isPackaged) {
	dev = true

	// Dev tools
	debug({
		showDevTools: false,
	})
}

/**
 * Version and logging
 */
const appVersion = app.getVersion()
const releaseDate = date
const buildNumber = number

const chromeVersion = process.versions.chrome
const electronVersion = process.versions.electron
const args = process.argv

// Send Authme info to renderer
ipc.handle("info", () => {
	return { appVersion, releaseDate, buildNumber }
})

// Hardware info
const osVersion = `${type()} ${arch()} ${release()}`
const osInfo = `${cpus()[0].model.split("@")[0]} ${Math.ceil(totalmem() / 1024 / 1024 / 1024)}GB RAM`
	.replaceAll("(R)", "")
	.replaceAll("(TM)", "")
	.replace(/ +(?= )/g, "")

/**
 * Allow only one instance
 */
if (!dev) {
	const lock = app.requestSingleInstanceLock()

	if (!lock) {
		console.log("Already running, shutting down")

		app.exit()
	} else {
		app.on("second-instance", () => {
			console.log("Already running, focusing window")

			mainWindow.show()
		})
	}
}

/**
 * Create main window
 */
const createWindow = () => {
	// Create main window
	mainWindow = new BrowserWindow({
		title: "Screentime",
		width: 1900,
		height: 1000,
		minWidth: 1000,
		minHeight: 600,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	// Initialize window
	mainWindow.loadFile(join(__dirname, "../interface/application/index.html"))

	/* Main window events */
	mainWindow.on("ready-to-show", () => {
		if (args[1] !== "--hidden") {
			mainWindow.maximize()
			mainWindow.show()

			mainWindowShown = true

			createTray()
		}
	})

	mainWindow.on("close", (event) => {
		if (!dev) {
			event.preventDefault()

			toggleMainWindow()
		}
	})

	power.on("lock-screen", () => {
		mainWindow.webContents.executeJavaScript("stopStatisticsUpdater()")
	})

	power.on("unlock-screen", () => {
		mainWindow.webContents.executeJavaScript("startStatisticsUpdater()")
	})

	/**
	 * Auto update
	 */
	if (!dev) {
		autoUpdater.checkForUpdates()
	}

	autoUpdater.on("checking-for-update", () => {
		console.log("Checking for auto update")
	})

	autoUpdater.on("update-available", () => {
		mainWindow.webContents.executeJavaScript("updateAvailable()")

		console.log("Update available")
	})

	autoUpdater.on("update-not-available", () => {
		console.log("Update not available")
	})

	autoUpdater.on("error", (error) => {
		console.log("Error during auto update", error.stack)
	})

	autoUpdater.on("download-progress", (progress) => {
		const downloadPercent = Math.trunc(progress.percent)
		const downloadSpeed = (Math.round((progress.bytesPerSecond / 1000000) * 10) / 10).toFixed(1)
		const downloadTransferred = Math.trunc(progress.transferred / 1000000)
		const downloadTotal = Math.trunc(progress.total / 1000000)

		console.log(`Downloading update: ${downloadPercent}% - ${downloadSpeed}MB/s (${downloadTransferred}MB/${downloadTotal}MB)`)

		mainWindow.webContents.send("updateInfo", {
			download_percent: downloadPercent,
			download_speed: downloadSpeed,
			download_transferred: downloadTransferred,
			download_total: downloadTotal,
		})
	})

	autoUpdater.on("update-downloaded", () => {
		console.log("Update downloaded")

		mainWindow.webContents.executeJavaScript("updateDownloaded()")
	})

	ipc.handle("updateRestart", () => {
		autoUpdater.quitAndInstall(true, true)
	})
}

/**
 * Show/hide main window
 */
const toggleMainWindow = () => {
	if (!mainWindowShown) {
		mainWindow.maximize()
		mainWindow.show()

		mainWindowShown = true
	} else {
		mainWindow.hide()

		mainWindowShown = false
	}

	createTray()
}

/* App ready, start creating window and menu */
app.on("ready", () => {
	/**
	 * Create tray
	 */
	tray = new Tray(join(__dirname, "../icons/icon.png"))
	tray.setToolTip("Screentime")

	tray.on("click", () => {
		toggleMainWindow()
		createTray()
	})

	/**
	 * Start app
	 */
	createWindow()
	createTray()
	Menu.setApplicationMenu(null) // disable default menubar
})

/**
 * Auto launch on system start
 */
const autoLauncher = new AutoLaunch({
	name: "Screentime",
	path: app.getPath("exe"),
	isHidden: true,
})

/**
 * About dialog
 */
const versionDialog = async () => {
	const text = `Screentime: ${appVersion} \n\nElectron: ${electronVersion}\nChrome: ${chromeVersion} \n\nOS version: ${osVersion}\nHardware info: ${osInfo} \n\nRelease date: ${releaseDate}\nBuild number: ${buildNumber} \n\nCreated by: Lőrik Levente\n`

	shell.beep()

	const result = await dialog.showMessageBox({
		title: "Authme",
		buttons: ["Copy", "Close"],
		defaultId: 1,
		cancelId: 1,
		noLink: true,
		type: "info",
		message: text,
		icon: join(__dirname, "../icons/icon.png"),
	})

	if (result.response === 0) {
		clipboard.writeText(text)
	}
}

/* IPCs */
ipc.handle("versionDialog", () => {
	versionDialog()
})

ipc.handle("toggleStartup", async () => {
	const enabled: boolean = await autoLauncher.isEnabled()

	console.log(`Auto launch: ${enabled}`)

	if (enabled) {
		autoLauncher.disable()
	} else {
		autoLauncher.enable()
	}
})

ipc.handle("releaseNotes", () => {
	shell.openExternal("https://github.com/Levminer/screentime/releases")
})

ipc.handle("updateTrayTooltip", (event, text: string) => {
	tray.setToolTip(`Screentime\n(${text})`)
})

ipc.on("getDevMode", (event) => {
	event.returnValue = dev
})

/**
 * Create tray menu
 */
const createTray = () => {
	const contextmenu = Menu.buildFromTemplate([
		{
			label: mainWindowShown ? "Hide Screentime" : "Show Screentime",
			click: () => {
				toggleMainWindow()
			},
		},
		{ type: "separator" },
		{
			label: "Exit Screentime",
			click: () => {
				app.exit()
			},
		},
	])

	tray.setContextMenu(contextmenu)
}
