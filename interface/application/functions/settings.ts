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
