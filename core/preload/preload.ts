import { Menu, getCurrentWindow } from "@electron/remote"
import Titlebar = require("@6c65726f79/custom-titlebar")

const window = getCurrentWindow()

/* Title bar on windows */
if (process.platform === "win32") {
	window.webContents.once("dom-ready", () => {
		// @ts-ignore
		// eslint-disable-next-line no-new
		new Titlebar({
			menu: Menu.getApplicationMenu(),
			browserWindow: window,
			backgroundColor: "#000000",
			icon: "../../icons/icon.png",
			unfocusEffect: false,
		})
	})
}
