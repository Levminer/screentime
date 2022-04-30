import * as dateFns from "date-fns"
import { Chart } from "chart.js"

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
	const name = dateFns.format(date, "EEEE")
	const week = dateFns.getISOWeek(new Date())
	const id = dateFns.getISODay(date)

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
} else {
	weeklyChart()
}

const updateStatistics = () => {
	// today
	let today: string

	if (hours === 0) {
		today = `${minutes} minutes`
	} else {
		today = `${hours} hours and ${minutes} minutes`
	}

	document.querySelector(".todayUsage").textContent = today

	// today avg
	let todayAvg: string
	let userAvg = 200
	let todayAllAvg = hours * 60 + minutes

	if (todayAllAvg > userAvg) {
		todayAvg = `You spent ${todayAllAvg - userAvg} minutes more than an average user`
	} else {
		todayAvg = `You spent ${userAvg - todayAllAvg} minutes less than an average user`
	}

	document.querySelector(".todayAvgUsage").textContent = todayAvg
}

/**
 * Save minutes and hours
 */
setInterval(() => {
	//console.log(storage)

	const index = storage.statistics[year].length - 1
	const obj: LibStatistic = storage.statistics[year][index]

	const currentDate = getDate()

	if (obj.date.full_date === currentDate.full_date) {
		minutes = obj.minutes
		hours = obj.hours

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
