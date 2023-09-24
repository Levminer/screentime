const { existsSync, mkdirSync, writeFileSync } = require("fs")
const package = require("../package.json")

const build = new Date().toISOString().replace("T", "X").replaceAll(":", ".").substring(0, 19).replaceAll("-", ".").slice(2).replaceAll(".", "").replace("X", ".")

const date = new Date()

const year = date.getFullYear()
const month = date.toLocaleString("en-us", { timeZone: "UTC", month: "long" })
const day = date.toISOString().substring(8, 10)

const buildNumber = `${process.argv[2]}.${build}`
const releaseDate = `${year}. ${month} ${day}.`

const file = {
	number: buildNumber,
	date: releaseDate,
	version: package.version,
	arch: process.arch,
}

if (!existsSync("dist")) {
	mkdirSync("dist")
}

writeFileSync("build.json", JSON.stringify(file, null, "\t"))
writeFileSync("dist/build.json", JSON.stringify(file, null, "\t"))
