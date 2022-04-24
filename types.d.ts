declare global {
	interface LibDateObject {
		year: string
		month: string
		day: string
		full_date: string
	}

	interface LibStatistic {
		date: LibDateObject
		hours: number
		minutes: number
	}

	interface LibStorage {
		statistics: LibStatistic[]
		updatedAt: number
		createdAt: number
	}
}

export {}
