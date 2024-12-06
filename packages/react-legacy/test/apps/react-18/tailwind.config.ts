import type { Config } from 'tailwindcss'
import reset from 'tw-reset'

const config: Config = {
	presets: [reset],
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				background: 'var(--background)',
				foreground: 'var(--foreground)'
			}
		}
	},
	plugins: []
}
export default config
