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

/**
 * Load storage
 */
let storage: LibStorage = JSON.parse(localStorage.getItem("storage"))

/**
 * Create storage if it not exists
 */
if (storage === null) {
	const temp_storage: LibStorage = {
		statistics: [],
		updatedAt: Date.now(),
		createdAt: Date.now(),
	}

	temp_storage.statistics.push({
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
	const index = storage.statistics.length - 1
	const currentDate = getDate()

	minutes = storage.statistics[index].minutes
	hours = storage.statistics[index].hours

	if (storage.statistics[storage.statistics.length - 1].date.full_date === currentDate.full_date) {
		storage.statistics[index].minutes++
		minutes++

		if (minutes % 60 === 0) {
			storage.statistics[index].hours++
			hours++

			minutes = 0
		}
	} else {
		storage.statistics.push({
			hours: hours,
			minutes: minutes,
			date: getDate(),
		})
	}

	console.log(storage.statistics)

	localStorage.setItem("storage", JSON.stringify(storage))
}, 500)
