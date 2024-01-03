import { Chart, registerables } from "chart.js"
import { getDate, toHoursAndMinutes } from "../../libraries/date"
import { ipcRenderer as ipc } from "electron"
import * as settings from "./functions/settings"
import build from "../../build.json"

// Register chart.js plugins
Chart.register(...registerables)

/**
 * States
 */
let minutes: number = 0
let hours: number = 0
let weekChart: Chart<"bar">
let monthChart: Chart<"pie">
const { year } = getDate()
let statisticsUpdater: NodeJS.Timeout

/**
 * Check if running in development
 */
const dev: boolean = ipc.sendSync("getDevMode")

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

	// settings
	const settings: LibSettings = {
		info: {
			version: build.version,
			build: build.number,
			date: build.date,
		},

		settings: {
			launchOnStartup: true,
		},
	}

	localStorage.setItem("settings", JSON.stringify(settings))

	if (dev === false) {
		ipc.invoke("toggleStartup")
	}
}

/**
 * Create weekly chart
 */
const createCharts = () => {
	const currentDate = getDate()
	const days: LibStatistic[] = storage.statistics[year]

	// Weekly chart
	const weekDataset = [0, 0, 0, 0, 0, 0, 0]

	for (let i = 0; i < days.length; i++) {
		if (days[i].date.weekID === currentDate.weekID) {
			const totalHours = Math.round(((days[i].hours * 60 + days[i].minutes) / 60) * 100) / 100

			weekDataset[days[i].date.dayID] = totalHours
		}
	}

	// @ts-ignore
	const weeklyChart = document.getElementById("weeklyChart").getContext("2d")

	weekChart = new Chart(weeklyChart, {
		type: "bar",
		data: {
			labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			datasets: [
				{
					label: "Hours",
					data: weekDataset,
					backgroundColor: ["#1b5788", "#575a9e", "#8C60A9", "#C76BA2", "#F16A85", "#FF9470", "#FFB01F"],
					borderColor: ["gray"],
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						color: "#e5e7eb",
					},
				},
				x: {
					ticks: {
						color: "#e5e7eb",
					},
				},
			},
			plugins: {
				legend: {
					display: false,
				},
			},
		},
	})

	// Monthly chart
	const monthDataset = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

	for (let i = 0; i < days.length; i++) {
		monthDataset[days[i].date.monthID] += Math.round(((days[i].hours * 60 + days[i].minutes) / 60) * 100) / 100
	}

	// @ts-ignore
	const monthlyChart = document.getElementById("monthlyChart").getContext("2d")

	monthChart = new Chart(monthlyChart, {
		type: "pie",
		data: {
			labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			datasets: [
				{
					label: "Hours",
					data: monthDataset,
					backgroundColor: ["#1b5788", "#575a9e", "#8C60A9", "#C76BA2", "#F16A85", "#FF9470", "#FFB01F", "#bc4749", "#a7c957", "#e0afa0", "#7678ed", "#fb8500"],
				},
			],
		},
		options: {
			plugins: {
				legend: {
					display: false,
				},
			},
		},
	})
}

const updateCalendar = () => {
	const currentDate = getDate()

	const arr: LibStatistic[] = storage.statistics[year]
	const dataset: LibStatistic[] = []

	for (let i = 0; i < arr.length; i++) {
		if (arr[i].date.monthID === currentDate.monthID) {
			dataset.push(arr[i])
		}
	}

	// adjust calendar
	for (let i = 1; i < 8; i++) {
		const date = new Date(`${currentDate.year}-${currentDate.month}-${i}`)
		const name = date.toLocaleString("en", { weekday: "long" })

		document.querySelector(`.week${i}`).textContent = name
	}

	// remove days
	const daysInMonth = new Date(currentDate.date.getFullYear(), currentDate.date.getMonth() + 1, 0).getDate()

	let counter = 31
	for (let i = 0; i < 31 - daysInMonth; i++) {
		document.querySelector(`#day${counter}Container`).style.display = "none"

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

		if (stats.hours === 0) {
			element.textContent = `${stats.minutes} minutes`
		} else {
			element.textContent = `${stats.hours} hours and ${stats.minutes} minutes`
		}
	}
}

const updateCharts = () => {
	monthChart.destroy()
	weekChart.destroy()

	createCharts()
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
	const days: LibStatistic[] = storage.statistics[year]

	minutes = obj.minutes
	hours = obj.hours

	// Todays screen time
	const todayMinutes = hours * 60 + minutes

	document.querySelector(".todayUsage").textContent = `Today you spent ${toHoursAndMinutes(todayMinutes)}`

	// Average screen time
	let time = 0
	let counter = 0

	for (let i = 0; i < days.length; i++) {
		time += days[i].hours * 60 + minutes
		counter++
	}

	const avg = Math.round(time / counter).toString()

	document.querySelector(".avgUsage").textContent = `Your average is ${toHoursAndMinutes(avg)}`

	// Global average
	let globalAvg: string
	const globalUserAvg = 200
	const todayAllAvg = hours * 60 + minutes

	if (todayAllAvg > globalUserAvg) {
		globalAvg = `You spend ${toHoursAndMinutes(todayAllAvg - globalUserAvg)} more than an average user`
	} else {
		globalAvg = `You spend ${toHoursAndMinutes(globalUserAvg - todayAllAvg)} less than an average user`
	}

	document.querySelector(".globalAvgUsage").textContent = globalAvg

	// Total screen time
	let totalMinutes = 0

	for (let i = 0; i < days.length; i++) {
		totalMinutes += days[i].hours * 60
		totalMinutes += days[i].minutes
	}

	document.querySelector(".totalTime").textContent = `Your total screen time is ${toHoursAndMinutes(totalMinutes)}`

	// Max screen time
	let maxMinutes = days[0].hours * 60 + days[0].minutes

	for (let i = 0; i < days.length; i++) {
		const currentMinutes = days[i].hours * 60 + days[i].minutes

		if (currentMinutes > maxMinutes) {
			maxMinutes = currentMinutes
		}
	}

	document.querySelector(".longestTime").textContent = `Your longest screen time is ${toHoursAndMinutes(maxMinutes)}`

	// Min screen time
	let minMinutes = days[0].hours * 60 + days[0].minutes

	for (let i = 0; i < days.length; i++) {
		const currentMinutes = days[i].hours * 60 + days[i].minutes

		if (currentMinutes < minMinutes) {
			minMinutes = currentMinutes
		}
	}

	document.querySelector(".lowestTime").textContent = `Your shortest screen time is ${toHoursAndMinutes(minMinutes)}`
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

	ipc.invoke("updateTrayTooltip", `${hours}h ${minutes}m`)

	setStatistics()
	updateCharts()
	updateCalendar()

	console.log(`Statistics updated - ${new Date().toLocaleTimeString()} - ${hours} hours - ${minutes} minutes`)
}

/**
 * Pause/resume updating statistics
 */
export const stopStatisticsUpdater = () => {
	clearInterval(statisticsUpdater)

	console.log(`Statistics updater stop - ${new Date().toLocaleTimeString()}`)
}

export const startStatisticsUpdater = () => {
	stopStatisticsUpdater()

	statisticsUpdater = setInterval(() => {
		updateStatistics()
	}, 60000)

	console.log(`Statistics updater start - ${new Date().toLocaleTimeString()}`)
}

/*
 * Check if year exists
 */
if (storage.statistics[year] === undefined) {
	storage.statistics[year] = []

	storage.statistics[year].push({
		hours,
		minutes,
		date: getDate(),
	})
}

/**
 * Start updating statistics
 */
const startUpdater = async () => {
	type PowerState = "active" | "idle" | "locked" | "unknown"
	const powerState: PowerState = await ipc.invoke("powerState")
	console.log(`Starting power state: ${powerState}`)

	if (powerState === "active" || powerState === "unknown") {
		statisticsUpdater = setInterval(() => {
			updateStatistics()
		}, 60000)
	}
}

startUpdater()
createCharts()
updateStatistics()

settings.setupSettings()
buildNumber()
