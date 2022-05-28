/* eslint-disable no-unused-vars */
declare global {
	type LibPlatform = "windows" | "mac" | "linux"

	interface LibDateObject {
		year: string
		month: string
		day: string
		fullDate: string
		name: string
		week: number
		id: number
	}

	interface LibStatistic {
		date: LibDateObject
		hours: number
		minutes: number
	}

	interface LibStatistics {
		2022?: LibStatistic[]
	}

	interface LibStorage {
		settings: {
			launchOnStartup: boolean
		}
		statistics: LibStatistics
		updatedAt: number
		createdAt: number
	}

	/** Query selector element types */
	interface Element {
		/** Element styles */
		style: CSSStyleDeclaration
	}

	/** HTML dialog element types */
	interface LibDialogElement extends Element {
		/** Show the dialog as a modal */
		showModal: Function

		/* Close the modal */
		close: Function

		/** Property if dialog open */
		open: boolean
	}
}

export {}
