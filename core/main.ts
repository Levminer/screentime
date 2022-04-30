import { app, BrowserWindow } from "electron"
import { join } from "path"

let mainWindow: BrowserWindow

const appVersion = app.getVersion()

const createWindow = () => {
	mainWindow = new BrowserWindow({
		title: `Screentime (${appVersion})`,
		width: 1900,
		height: 1000,
		minWidth: 1000,
		minHeight: 600,
		show: false,
		backgroundColor: "#0A0A0A",
		webPreferences: {
			// preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	mainWindow.loadFile(join(__dirname, "../interface/application/index.html"))

	mainWindow.on("ready-to-show", () => {
		mainWindow.maximize()
		mainWindow.show()
	})
}

app.on("ready", () => {
	createWindow()
})
