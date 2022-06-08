module.exports = {
	mode: "jit",
	content: ["./interface/**/*.html", "./interface/**/*.js"],
	theme: {
		extend: {
			colors: {
				gray: {
					500: "#282828",
					600: "#1E1E1E",
					700: "#141414",
					800: "#0a0a0a",
					900: "#000000",
				},
				popup: {
					red: "#CC001B",
					green: "#28A443",
					blue: "#16A3DF",
					yellow: "#F5AB00",
					magenta: "#9B5094",
				},
				html: {
					gray: "#808080",
				},
			},

			borderRadius: {
				"2xl": "30px",
			},

			stroke: (theme) => ({
				black: theme("colors.gray.900"),
			}),
		},
	},
}
