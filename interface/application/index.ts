let minutes: number = 0
let hours: number = 0

/**
 * Get current date
 */
const getDate = () => {
	const date = new Date()

	const year = date.getFullYear().toString()
	const month = date.toLocaleString("en", { month: "long" })
	const day = date.toISOString().substring(8, 10)

	const full_date = `${year} ${month} ${day}.`

	return { year, month, day, full_date }
}

const { year } = getDate()

/**
 * Load storage
 */
let storage: LibStorage = JSON.parse(localStorage.getItem("storage"))

/**
 * Create storage if it not exists
 */
if (storage === null) {
	const temp_storage: LibStorage = {
		statistics: {},
		updatedAt: Date.now(),
		createdAt: Date.now(),
	}

	temp_storage.statistics[year] = []

	temp_storage.statistics[year].push({
		hours: hours,
		minutes: minutes,
		date: getDate(),
	})

	localStorage.setItem("storage", JSON.stringify(temp_storage))

	storage = temp_storage
}

/**
 * Save minutes and hours
 */
setInterval(() => {
	console.log(storage)

	const index = storage.statistics[year].length - 1
	const obj: LibStatistic = storage.statistics[year][index]

	const currentDate = getDate()

	minutes = obj.minutes
	hours = obj.hours

	if (obj.date.full_date === currentDate.full_date) {
		obj.minutes++
		minutes++

		if (minutes === 60) {
			obj.hours++
			hours++

			obj.minutes = 0
			minutes = 0
		}
	} else {
		storage.statistics[year].push({
			hours: hours,
			minutes: minutes,
			date: getDate(),
		})
	}

	localStorage.setItem("storage", JSON.stringify(storage))

	updateStatistics()
}, 3000)
