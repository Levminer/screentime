module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		node: true,
	},
	parser: "@typescript-eslint/parser",
	extends: ["standard", "eslint:recommended", "plugin:node/recommended", "plugin:promise/recommended", "plugin:@typescript-eslint/eslint-recommended", "prettier"],
	plugins: ["@typescript-eslint"],
	ignorePatterns: ["/node_modules/*", "/dist/*", "/build/*", "/src/*"],
	parserOptions: {
		ecmaVersion: 12,
	},
	rules: {
		indent: ["off", "tab", { SwitchCase: 1 }],
		quotes: ["error", "double"],
		semi: ["error", "never"],
		"prefer-const": ["warn"],
		"prefer-arrow-callback": ["error"],
		"prefer-template": ["error"],
		"func-style": ["error"],
		"no-var": ["error"],
		"node/no-unpublished-require": ["off"],
		"node/no-unpublished-import": ["off"],
		"node/no-unsupported-features/es-syntax": ["off"],
		"no-unused-vars": ["warn"],
	},
}
