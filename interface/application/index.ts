import { Chart } from "chart.js"
import { getDate } from "../../libraries/date"
import { ipcRenderer as ipc } from "electron"
import { app } from "@electron/remote"
import * as settings from "./functions/settings"
import { join } from "path"
import { readFileSync } from "fs"

/**
 * States
 */
let minutes: number = 0
let hours: number = 0
let chart: Chart
const { year } = getDate()
let statisticsUpdater: NodeJS.Timeout

/**
 * Check if running in development
 */
let dev = false

if (app.isPackaged === false) {
	dev = true
}

/**
 * Get settings file
 */
const folderPath = dev ? join(app.getPath("appData"), "Levminer", "Screentime Dev") : join(app.getPath("appData"), "Levminer", "Screentime")
const settingsFile: LibSettings = JSON.parse(readFileSync(join(folderPath, "settings.json"), "utf-8"))

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
 * Create weekly chart
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

const updateCalendar = () => {
	const date = getDate()

	const arr: LibStatistic[] = storage.statistics[year]
	const dataset: LibStatistic[] = []

	for (let i = 0; i < arr.length; i++) {
		if (arr[i].date.month === date.month) {
			dataset.push(arr[i])
		}
	}

	// adjust calendar
	const month = dataset[0].date

	for (let i = 1; i < 8; i++) {
		const date = new Date(`${month.year}-${month.month}-${i}`)

		const name = date.toLocaleString("en", { weekday: "long" })

		const element = document.querySelector(`.week${i}`)

		element.textContent = name
	}

	// remove days
	const useDate = new Date(`${month.year}-${month.month}-1`)

	const daysInMonth = new Date(useDate.getFullYear(), useDate.getMonth() + 1, 0).getDate()

	let counter = 31
	for (let i = 0; i < 31 - daysInMonth; i++) {
		const element = document.querySelector(`#day${counter}Container`)

		element.style.display = "none"

		counter--
	}

	// assign days
	for (let i = 0; i < dataset.length; i++) {
		const stats = dataset[i]
		let day = dataset[i].date.day

		if (day.startsWith("0")) {
			day = day[1]
		}

		const element = document.querySelector(`.day${day}`)

		element.textContent = `${stats.hours} hours and ${stats.minutes} minutes`
	}
}

const updateChart = () => {
	chart.destroy()
	weeklyChart()
}

export const versionDialog = () => {
	ipc.invoke("versionDialog")
}

ipc.on("toggleSettings", () => {
	settings.toggleSettings()
})

/**
 * Update statistics
 */
const setStatistics = () => {
	const index = storage.statistics[year].length - 1
	const obj: LibStatistic = storage.statistics[year][index]

	minutes = obj.minutes
	hours = obj.hours

	// Todays screen time
	let today: string

	if (hours === 0) {
		today = `Today you spent ${minutes} minutes`
	} else {
		today = `${hours} hours and ${minutes} minutes`
	}

	document.querySelector(".todayUsage").textContent = today

	// Average screen time
	const arr: LibStatistic[] = storage.statistics[year]
	let time = 0
	let counter = 0

	for (let i = 0; i < arr.length; i++) {
		time += arr[i].hours * 60 + minutes
		counter++
	}

	const avg = Math.round(time / counter).toString()

	document.querySelector(".avgUsage").textContent = `You spend about ${avg} minutes daily`

	// Global average
	let globalAvg: string
	const globalUserAvg = 200
	const todayAllAvg = hours * 60 + minutes

	if (todayAllAvg > globalUserAvg) {
		globalAvg = `You spent ${todayAllAvg - globalUserAvg} minutes more than an average user`
	} else {
		globalAvg = `You spent ${globalUserAvg - todayAllAvg} minutes less than an average user`
	}

	document.querySelector(".globalAvgUsage").textContent = globalAvg
}

const buildNumber = async () => {
	const info = await ipc.invoke("info")

	if (info.buildNumber.startsWith("alpha")) {
		document.querySelector(".buildContent").textContent = `You are running an alpha version of Screentime - Version ${info.appVersion} - Build ${info.buildNumber}`
		document.querySelector(".build").style.display = "block"
	}
}

/**
 * Auto update
 */
export const releaseNotes = () => {
	ipc.invoke("releaseNotes")
}

export const updateDownloaded = () => {
	document.querySelector(".updateText").textContent = "Update downloaded"
	document.querySelector(".updateRestart").style.display = "flex"
	document.querySelector(".updateClose").style.display = "flex"
}

export const updateRestart = () => {
	ipc.invoke("updateRestart")
}

export const updateAvailable = () => {
	document.querySelector(".autoUpdate").style.display = "block"
}

ipc.on("updateInfo", (event, info) => {
	document.querySelector(".updateText").textContent = `Downloading update: ${info.download_percent}% - ${info.download_speed}MB/s (${info.download_transferred}MB/${info.download_total}MB)`
})

/**
 * Update statistics
 */
const updateStatistics = () => {
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

	setStatistics()
	updateChart()
	updateCalendar()
}

/**
 * Pause/resume updating statistics
 */
export const stopStatisticsUpdater = () => {
	clearInterval(statisticsUpdater)
}

export const startStatisticsUpdater = () => {
	statisticsUpdater = setInterval(() => {
		updateStatistics()
	}, 60000)
}

/**
 * Save minutes and hours
 */
statisticsUpdater = setInterval(() => {
	updateStatistics()
}, 60000)

weeklyChart()
updateStatistics()
settings.setupSettings(settingsFile)
buildNumber()
updateCalendar()
