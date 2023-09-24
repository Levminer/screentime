/* eslint-disable no-unused-vars */
declare global {
	interface LibDateObject {
		year: string
		month: string
		day: string
		fullDate: string
		date: Date
		name: string
		weekID: number
		dayID: number
		monthID: number
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
		statistics: LibStatistics
		updatedAt: number
		createdAt: number
	}

	interface LibSettings {
		info: {
			version: string
			build: string
			date: string
		}

		settings: {
			launchOnStartup: boolean
		}
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
