import * as dayjs from "dayjs"
import * as isoWeek from "dayjs/plugin/isoWeek"

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
	const week = dayjs(date).isoWeek()
	const id = dayjs(date).isoWeekday() - 1

	const fullDate = `${year} ${month} ${day}.`

	return { year, month, day, fullDate, week, name, id }
}
