import { app, BrowserWindow, dialog, shell, clipboard, Menu, ipcMain as ipc, globalShortcut } from "electron"
import { enable, initialize } from "@electron/remote/main"
import { date, number } from "../build.json"
import AutoLaunch = require("auto-launch")
import { join } from "path"
import { type, arch, release, cpus, totalmem } from "os"

let mainWindow: BrowserWindow

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
 * Create main window
 */
const createWindow = () => {
	// Init remote module
	initialize()

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
			preload: join(__dirname, "../interface/preload/preload.js"),
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	enable(mainWindow.webContents)
	mainWindow.loadFile(join(__dirname, "../interface/application/index.html"))

	mainWindow.on("ready-to-show", () => {
		if (args[1] !== "--hidden") {
			mainWindow.maximize()
			mainWindow.show()
		}

		if (dev === false) {
			autoLauncher.enable()
		}
	})

	globalShortcut.register("CommandOrControl+Shift+t", () => {
		mainWindow.show()
	})
}

/* App ready, start creating window and menu */
app.on("ready", () => {
	createWindow()
	createMenu()
})

/**
 * Auto launch on system start
 */

const autoLauncher = new AutoLaunch({
	name: "Authme",
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

ipc.handle("versionDialog", () => {
	versionDialog()
})

/**
 * Create application menu
 */
const createMenu = () => {
	const menu = Menu.buildFromTemplate([
		{
			label: "File",
			submenu: [
				{
					label: "Show app",
				},
				{
					type: "separator",
				},
				{
					label: "Settings",
				},
				{
					type: "separator",
				},
				{
					label: "Exit",
					accelerator: "CommandOrControl+w",
					click: () => {
						app.quit()
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
				{
					type: "separator",
				},
				{
					label: "Zoom In",
					role: "zoomIn",
					accelerator: "CommandOrControl+1",
				},
				{
					type: "separator",
				},
				{
					label: "Zoom Out",
					role: "zoomOut",
					accelerator: "CommandOrControl+2",
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
				{
					type: "separator",
				},
				{
					label: "Update",
				},
				{
					type: "separator",
				},
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
