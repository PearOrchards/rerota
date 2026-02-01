import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		"components/ui/**", // don't bother with shadcn components (yet)
		"generated/**", // don't lint generated Prisma files
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
	]),
	{
		rules: {
			// Custom rules, taken from previous project
			"arrow-spacing": ["warn", { before: true, after: true }],
			"comma-dangle": ["error", "always-multiline"],
			"comma-spacing": "error",
			"comma-style": "error",
			"dot-location": ["error", "property"],
			"handle-callback-err": "off",
			indent: ["error", "tab", { SwitchCase: 1 }],
			"keyword-spacing": "error",
			"max-nested-callbacks": ["error", { max: 4 }],
			"max-statements-per-line": ["error", { max: 2 }],
			"no-console": "off",
			"no-empty-function": "error",
			"no-floating-decimal": "error",
			"no-inline-comments": "off",
			"no-lonely-if": "error",
			"no-multi-spaces": "error",
			"no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1, maxBOF: 0 }],
			"no-shadow": ["error", { allow: ["err", "resolve", "reject"] }],
			"no-trailing-spaces": ["error"],
			"no-var": "error",
			"no-undef": "off",
			"object-curly-spacing": ["error", "always"],
			"prefer-const": "error",
			quotes: ["error", "double"],
			semi: ["error", "always"],
			"space-before-blocks": "error",
			"space-before-function-paren": ["error", {
				anonymous: "never",
				named: "never",
				asyncArrow: "always",
			}],
			"space-in-parens": "error",
			"space-infix-ops": "error",
			"space-unary-ops": "error",
			"spaced-comment": "error",
			yoda: "error",
		},
	},
]);

export default eslintConfig;
