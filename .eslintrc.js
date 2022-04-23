module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		node: true,
	},
	extends: ["standard", "eslint:recommended", "plugin:node/recommended", "plugin:promise/recommended", "plugin:prettier/recommended"],
	plugins: ["prettier"],
	ignorePatterns: ["/node_modules/*", "/dist/*", "/build/*", "/src/*"],
	parserOptions: {
		ecmaVersion: 12,
	},
	rules: {
		indent: ["off", "tab", { SwitchCase: 1 }],
		quotes: ["error", "double"],
		semi: ["error", "never"],
		"prettier/prettier": ["warn"],
		"linebreak-style": ["warn", "windows"],
		"prefer-const": ["warn"],
		"prefer-arrow-callback": ["error"],
		"prefer-template": ["error"],
		"func-style": ["error"],
		"no-var": ["error"],
		"node/no-unpublished-require": ["off"],
	},
}
