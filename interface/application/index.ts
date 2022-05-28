import { Chart } from "chart.js"
import { getDate } from "../../libraries/date"
import { ipcRenderer as ipc } from "electron"
import { toggleSettings } from "./functions/settings"

let minutes: number = 0
let hours: number = 0
let chart: Chart
const { year } = getDate()

/**
 * Load storage
 */
let storage: LibStorage = JSON.parse(localStorage.getItem("storage"))

/**
 * Create storage if it not exists
 */
if (storage === null) {
	const tempStorage: LibStorage = {
		statistics: {},
		updatedAt: Date.now(),
		createdAt: Date.now(),
	}

	tempStorage.statistics[year] = []

	tempStorage.statistics[year].push({
		hours,
		minutes,
		date: getDate(),
	})

	localStorage.setItem("storage", JSON.stringify(tempStorage))

	storage = tempStorage
}

/**
 * Create and update weekly chart
 */
const weeklyChart = () => {
	const date = getDate()

	const arr: LibStatistic[] = storage.statistics[year]
	const dataset = [0, 0, 0, 0, 0, 0, 0]

	for (let i = 0; i < arr.length; i++) {
		if (arr[i].date.week === date.week) {
			dataset[arr[i].date.id] = arr[i].hours * 60 + arr[i].minutes
		}
	}

	// @ts-ignore
	const ctx = document.getElementById("weeklyChart").getContext("2d")

	chart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			datasets: [
				{
					label: "Minutes",
					data: dataset,
					backgroundColor: ["#003f5c", "#374c80", "#7a5195", "#bc5090", "#ef5675", "#ff764a", "#ffa600"],
					borderColor: ["gray"],
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						color: "gray",
					},
				},
				x: {
					ticks: {
						color: "gray",
					},
				},
			},
			plugins: {
				legend: {
					display: false,
					labels: {},
				},
			},
		},
	})
}

const updateChart = () => {
	chart.destroy()
	weeklyChart()
}

// eslint-disable-next-line no-unused-vars
const versionDialog = () => {
	ipc.invoke("versionDialog")
}

ipc.on("toggleSettings", () => {
	toggleSettings()
})

/**
 * Update statistics
 */
const updateStatistics = () => {
	const index = storage.statistics[year].length - 1
	const obj: LibStatistic = storage.statistics[year][index]

	minutes = obj.minutes
	hours = obj.hours

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
	const userAvg = 200
	const todayAllAvg = hours * 60 + minutes

	if (todayAllAvg > userAvg) {
		todayAvg = `You spent ${todayAllAvg - userAvg} minutes more than an average user`
	} else {
		todayAvg = `You spent ${userAvg - todayAllAvg} minutes less than an average user`
	}

	document.querySelector(".todayAvgUsage").textContent = todayAvg

	// avg
	const arr: LibStatistic[] = storage.statistics[year]
	let time = 0
	let counter = 0

	for (let i = 0; i < arr.length; i++) {
		time += arr[i].hours * 60 + minutes
		counter++
	}

	const avg = (time / counter).toString()

	document.querySelector(".avgUsage").textContent = `You spend about ${avg} minutes daily`
}

const buildNumber = async () => {
	const info = await ipc.invoke("info")

	console.log(info)

	if (info.buildNumber.startsWith("alpha")) {
		document.querySelector(".buildContent").textContent = `You are running an alpha version of Screentime - Version ${info.appVersion} - Build ${info.buildNumber}`
		document.querySelector(".build").style.display = "block"
	} else if (info.buildNumber.startsWith("release")) {
		document.querySelector(".buildContent").textContent = `You are running a pre release version of Screentime - Version ${info.appVersion} - Build ${info.buildNumber}`
		document.querySelector(".build").style.display = "block"
	}
}

buildNumber()

const getToday = () => {
	const index = storage.statistics[year].length - 1
	const obj: LibStatistic = storage.statistics[year][index]

	const currentDate = getDate()

	if (obj.date.fullDate === currentDate.fullDate) {
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
			hours,
			minutes,
			date: getDate(),
		})
	}

	localStorage.setItem("storage", JSON.stringify(storage))

	updateStatistics()
	updateChart()
}

/**
 * Save minutes and hours
 */
setInterval(() => {
	getToday()
}, 60000)

weeklyChart()
getToday()
