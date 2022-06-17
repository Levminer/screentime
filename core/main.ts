import { app, BrowserWindow, dialog, shell, clipboard, Menu, ipcMain as ipc, globalShortcut, Tray, powerMonitor as power } from "electron"
import { enable, initialize } from "@electron/remote/main"
import { autoUpdater } from "electron-updater"
import { date, number } from "../build.json"
import AutoLaunch = require("auto-launch")
import { join } from "path"
import { type, arch, release, cpus, totalmem } from "os"
import { existsSync, mkdirSync, writeFileSync } from "fs"

/**
 * Window states
 */
let mainWindow: BrowserWindow
let mainWindowShown = false
let manualUpdate = false

// Other states
let tray: Tray
let menu: Menu
let firstStart = false

/**
 * Check if running in development mode
 */
let dev = false

if (app.isPackaged === false) {
	const debug = require("electron-debug")

	debug({
		showDevTools: false,
	})

	dev = true
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
 * Get platform
 */
let platform: LibPlatform

if (process.platform === "win32") {
	platform = "windows"
} else if (process.platform === "darwin") {
	platform = "mac"
} else {
	platform = "linux"
}

/**
 * Check for folders
 */
const parentFolder = join(app.getPath("appData"), "Levminer")
const folderPath = dev ? join(app.getPath("appData"), "Levminer", "Screentime Dev") : join(app.getPath("appData"), "Levminer", "Screentime")

// Check if /Levminer path exists
if (!existsSync(parentFolder)) {
	mkdirSync(join(parentFolder))
}

// Check if /Authme path exists
if (!existsSync(folderPath)) {
	mkdirSync(folderPath)
}

const settingsFile: LibSettings = {
	info: {
		version: appVersion,
		build: buildNumber,
		date: releaseDate,
	},

	settings: {
		launchOnStartup: true,
	},
}

// Create settings if not exists
if (!existsSync(join(folderPath, "settings.json"))) {
	writeFileSync(join(folderPath, "settings.json"), JSON.stringify(settingsFile, null, "\t"))

	firstStart = true
}

// Save settings
const saveSettings = () => {
	writeFileSync(join(folderPath, "settings.json"), JSON.stringify(settingsFile, null, "\t"))
}

/**
 * Allow only one instance
 */
if (dev === false) {
	const lock = app.requestSingleInstanceLock()

	if (lock === false) {
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
	/**
	 * Window Controls Overlay
	 */
	let wco = false

	if (platform === "windows") {
		wco = true
	}

	// Create main window
	mainWindow = new BrowserWindow({
		title: `Screentime (${appVersion})`,
		width: 1900,
		height: 1000,
		minWidth: 1000,
		minHeight: 600,
		show: false,
		titleBarStyle: wco ? "hidden" : null,
		titleBarOverlay: wco
			? {
					color: "black",
					symbolColor: "white",
			  }
			: null,
		backgroundColor: "#0A0A0A",
		webPreferences: {
			preload: join(__dirname, "./preload/preload.js"),
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	// Initialize window
	initialize()
	enable(mainWindow.webContents)
	mainWindow.loadFile(join(__dirname, "../interface/application/index.html"))

	/* Main window events */
	mainWindow.on("ready-to-show", () => {
		if (args[1] !== "--hidden") {
			mainWindow.maximize()
			mainWindow.show()

			mainWindowShown = true

			createTray()
		}

		if (firstStart === true && dev === false) {
			saveSettings()

			autoLauncher.enable()
		}
	})

	mainWindow.on("close", (event) => {
		if (dev === false) {
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
	if (dev === false) {
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

		if (manualUpdate === true) {
			dialog.showMessageBox({
				title: "Authme",
				buttons: ["Close"],
				defaultId: 0,
				cancelId: 1,
				noLink: true,
				type: "info",
				message: "No update available! \n\nYou are on the latest version.",
			})

			manualUpdate = false
		}
	})

	autoUpdater.on("error", (error) => {
		console.log("Error during auto update", error.stack)

		if (manualUpdate === true) {
			dialog.showMessageBox({
				title: "Authme",
				buttons: ["Close"],
				defaultId: 0,
				cancelId: 1,
				noLink: true,
				type: "error",
				message: `Error during auto update! \n\n${error.stack}`,
			})
		}
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

	/* Global shortcut */
	globalShortcut.register("CommandOrControl+Shift+s", () => {
		toggleMainWindow()
	})
}

/**
 * Show/hide main window
 */
const toggleMainWindow = () => {
	if (mainWindowShown === false) {
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
		createMenu()
	})

	/**
	 * Start app
	 */
	createWindow()
	createMenu()
	createTray()
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

	if (enabled === true) {
		autoLauncher.disable()

		settingsFile.settings.launchOnStartup = false
	} else {
		autoLauncher.enable()

		settingsFile.settings.launchOnStartup = true
	}

	saveSettings()
})

ipc.handle("releaseNotes", () => {
	shell.openExternal("https://github.com/Levminer/screentime/releases")
})

/**
 * Create tray menu
 */
const createTray = () => {
	const contextmenu = Menu.buildFromTemplate([
		{
			label: mainWindowShown ? "Hide app" : "Show app",
			accelerator: "CommandOrControl+Shift+s",
			click: () => {
				toggleMainWindow()
			},
		},
		{ type: "separator" },
		{
			label: "Settings",
			click: () => {
				mainWindow.show()
				mainWindow.webContents.send("toggleSettings")
			},
		},
		{ type: "separator" },
		{
			label: "Exit",
			click: () => {
				app.exit()
			},
		},
	])

	tray.setContextMenu(contextmenu)
}

/**
 * Create application menu
 */
const createMenu = () => {
	menu = Menu.buildFromTemplate([
		{
			label: "File",
			submenu: [
				{
					label: mainWindowShown ? "Show app" : "Hide app",
					click: () => {
						toggleMainWindow()
					},
				},
				{ type: "separator" },
				{
					label: "Settings",
					accelerator: "CommandOrControl+s",
					click: () => {
						mainWindow.webContents.send("toggleSettings")
					},
				},
				{ type: "separator" },
				{
					label: "Exit",
					accelerator: "CommandOrControl+w",
					click: () => {
						app.exit()
					},
				},
			],
		},
		{
			label: "View",
			submenu: [
				{
					label: "Reset Zoom",
					role: "resetZoom",
					accelerator: "CommandOrControl+0",
				},
				{ type: "separator" },
				{
					label: "Zoom In",
					role: "zoomIn",
					accelerator: "CommandOrControl+1",
				},
				{ type: "separator" },
				{
					label: "Zoom Out",
					role: "zoomOut",
					accelerator: "CommandOrControl+2",
				},
			],
		},
		{
			label: "Help",
			submenu: [
				{
					label: "Feedback",
					click: () => {
						shell.openExternal("https://github.com/Levminer/screentime/issues")
					},
				},
				{ type: "separator" },
				{
					label: "Release notes",
					click: () => {
						shell.openExternal("https://github.com/Levminer/screentime/releases")
					},
				},
				{ type: "separator" },
				{
					label: "Support",
					click: () => {
						shell.openExternal("https://paypal.me/levminer")
					},
				},
			],
		},
		{
			label: "About",
			submenu: [
				{
					label: "Licenses",
					click: async () => {
						const result = await dialog.showMessageBox({
							title: "Authme",
							buttons: ["More", "Close"],
							defaultId: 1,
							cancelId: 1,
							noLink: true,
							type: "info",
							message: "This software is licensed under GPL-3.0 \n\nCopyright © 2022 Lőrik Levente",
						})

						if (result.response === 0) {
							shell.openExternal("https://authme.levminer.com/licenses.html")
						}
					},
				},
				{ type: "separator" },
				{
					label: "Update",
					click: () => {
						manualUpdate = true

						autoUpdater.checkForUpdates()
					},
				},
				{ type: "separator" },
				{
					label: "Info",
					accelerator: "CommandOrControl+i",
					click: () => {
						versionDialog()
					},
				},
			],
		},
	])

	Menu.setApplicationMenu(menu)
}
