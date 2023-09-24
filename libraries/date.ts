import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"

dayjs.extend(isoWeek)

/**
 * Get current date
 */
export const getDate = () => {
	const date = new Date()

	const year = date.getFullYear().toString()
	const month = date.toLocaleString("en", { month: "long" })
	const day = date.toISOString().substring(8, 10)
	const name = date.toLocaleDateString("en", { weekday: "long" })

	const monthID = date.getMonth()
	const weekID = dayjs(date).isoWeek() - 1
	const dayID = dayjs(date).isoWeekday() - 1

	const fullDate = `${year} ${month} ${day}.`

	return { year, month, day, fullDate, weekID, name, dayID, monthID, date }
}

export const toHoursAndMinutes = (totalMinutes) => {
	const minutes = totalMinutes % 60
	const hours = Math.floor(totalMinutes / 60)

	if (hours === 0) {
		return `${minutes} minutes`
	} else {
		return `${hours} hours and ${minutes} minutes`
	}
}
