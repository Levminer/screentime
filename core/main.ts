import { app, BrowserWindow } from "electron"
import { enable, initialize } from "@electron/remote/main"
import { join } from "path"

let mainWindow: BrowserWindow

const appVersion = app.getVersion()

const createWindow = () => {
	// Init remote module
	initialize()

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
		mainWindow.maximize()
		mainWindow.show()
	})
}

app.on("ready", () => {
	createWindow()
})
