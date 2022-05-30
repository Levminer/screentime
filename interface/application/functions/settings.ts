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

	if (toggle.checked === false) {
		label.textContent = "Off"
	} else {
		label.textContent = "On"
	}

	ipc.invoke("toggleStartup")
}
