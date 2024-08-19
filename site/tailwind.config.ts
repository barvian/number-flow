import type { Config } from 'tailwindcss'
import reset from 'tw-reset'
import fluid, { extract, fontSize, type FluidThemeConfig } from 'fluid-tailwind'
import typography from '@tailwindcss/typography'

export default {
	presets: [reset()],
	content: {
		files: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
		transform: {
			mdx: (src) =>
				src
					// Ignore classes in code blocks
					.replaceAll(/```.*?```/gs, '')
					// Only return stuff in <component>s
					.match(/<[^/].*?>/g)
					?.join() ?? ''
		},
		extract
	},
	corePlugins: {
		container: false
	},
	theme: {
		fontSize,
		fluid: (({ theme }) => ({
			defaultScreens: [, theme('screens.xl')]
		})) satisfies FluidThemeConfig,
		extend: {}
	},
	plugins: [fluid, typography]
} satisfies Config
