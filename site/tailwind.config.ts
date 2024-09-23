import type { Config } from 'tailwindcss'
import reset from 'tw-reset'
import fluid, { extract, fontSize, screens, type FluidThemeConfig } from 'fluid-tailwind'
import typography from '@tailwindcss/typography'
// import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'

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
		screens,
		fontSize,
		// fontFamily: {
		// 	ui: defaultTheme.fontFamily.sans,
		// 	mono: defaultTheme.fontFamily.mono
		// },
		fluid: (({ theme }) => ({
			defaultScreens: [, theme('screens.md')]
		})) satisfies FluidThemeConfig,
		extend: {
			colors: {
				framework: 'var(--color-framework)'
			},
			screens: {
				xs: '20rem'
			},
			spacing: {
				'4.5': '1.125rem',
				18: '4.5rem'
			},
			transitionTimingFunction: {
				'out-quad': 'cubic-bezier(.25, .46, .45, .94)'
			},
			typography: {
				DEFAULT: {
					css: {
						'--tw-prose-links': 'currentColor',

						a: {
							'@apply link-underline': {}
						}
					}
				}
			}
		}
	},
	plugins: [
		fluid,
		typography,
		plugin(({ matchUtilities, theme }) => {
			matchUtilities(
				{
					'text-current': (_, { modifier }) =>
						modifier && {
							color: `color-mix(in srgb, currentColor, transparent ${(1 - modifier) * 100}%)`
						},
					'decoration-current': (_, { modifier }) =>
						modifier && {
							'text-decoration-color': `color-mix(in srgb, currentColor, transparent ${(1 - modifier) * 100}%)`
						}
				},
				{ values: { DEFAULT: '' }, modifiers: theme('opacity')! }
			)
		})
	]
} satisfies Config
