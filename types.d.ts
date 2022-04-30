declare global {
	interface LibDateObject {
		year: string
		month: string
		day: string
		full_date: string
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
		statistics: LibStatistics
		updatedAt: number
		createdAt: number
	}
}

export {}
