import { ipcRenderer as ipc } from "electron"

export const toggleSettings = () => {
	const dialog: LibDialogElement = document.querySelector(".dialog0")

	if (dialog.open === false) {
		dialog.showModal()
	} else {
		dialog.close()
	}
}

export const clearData = () => {
	localStorage.clear()
	location.reload()
}

export const changeStartup = () => {
	const toggle: HTMLInputElement = document.querySelector("#startupToggle")
	const label = document.querySelector("#startupLabel")
	const settings: LibSettings = JSON.parse(localStorage.getItem("settings"))

	if (toggle.checked === false) {
		label.textContent = "Off"

		settings.settings.launchOnStartup = false
	} else {
		label.textContent = "On"

		settings.settings.launchOnStartup = false
	}

	ipc.invoke("toggleStartup")
	localStorage.setItem("settings", JSON.stringify(settings))
}

export const setupSettings = () => {
	const toggle: HTMLInputElement = document.querySelector("#startupToggle")
	const label = document.querySelector("#startupLabel")

	toggle.checked = JSON.parse(localStorage.getItem("settings")).settings.launchOnStartup

	if (toggle.checked === false) {
		label.textContent = "Off"
	}
}
