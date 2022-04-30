import { Chart } from "chart.js"
import { getDate } from "../../libraries/date"

let minutes: number = 0
let hours: number = 0
let chart: Chart
const { year } = getDate()

const weeklyChart = () => {
	const date = getDate()

	console.log(storage)

	const arr: LibStatistic[] = storage.statistics[year]
	const dataset = [0, 0, 0, 0, 0, 0, 0]

	for (let i = 0; i < arr.length; i++) {
		if (arr[i].date.week === date.week) {
			dataset[arr[i].date.id] = arr[i].minutes
		}
	}

	// @ts-ignore
	const ctx = document.getElementById("myChart").getContext("2d")
	chart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			datasets: [
				{
					label: "Minutes",
					data: dataset,
					backgroundColor: ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF"],
					borderColor: ["gray"],
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
				},
			},
			plugins: {
				legend: {
					display: false,
				},
			},
		},
	})
}

const updateChart = () => {
	chart.destroy()
	weeklyChart()
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
	//updateChart()
}, 5000)
