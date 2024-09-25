import type { Config } from 'tailwindcss'
import reset from 'tw-reset'
import fluid, { extract, fontSize, screens, type FluidThemeConfig } from 'fluid-tailwind'
import typography from '@tailwindcss/typography'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'
import spring from 'tailwindcss-spring'
import type { PluginUtils } from 'tailwindcss/types/config'

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
		fontFamily: {
			sans: 'var(--font-inter)',
			ui: defaultTheme.fontFamily.sans,
			mono: defaultTheme.fontFamily.mono
		},
		fluid: (({ theme }) => ({
			defaultScreens: [, theme('screens.md')]
		})) satisfies FluidThemeConfig,
		extend: {
			colors: {
				framework: 'var(--color-framework)'
			},
			keyframes: {
				'pop-in': {
					from: {
						opacity: '0',
						transform: 'scale(.96)'
					}
				}
			},
			animation: {
				'pop-in': 'pop-in .1s ease'
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
			maxWidth: ({ theme }) => ({
				'9xl': theme('screens.2xl')
			}),
			typography: ({ theme }: PluginUtils) => ({
				DEFAULT: {
					css: {
						'--tw-prose-links': 'currentColor',

						a: {
							'@apply link-underline': {}
						}
					}
				},
				'invert-zinc': {
					css: {
						'--tw-prose-hr': theme('colors.zinc.800'),
						'--tw-prose-headings': theme('colors.zinc.50'),
						'--tw-prose-code': theme('colors.zinc.50'),
						'--tw-prose-body': theme('colors.zinc.300'),
						'--tw-prose-links': 'theme(colors.white)'
					}
				}
			})
		}
	},
	plugins: [
		spring,
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
						},
					'border-current': (_, { modifier }) =>
						modifier && {
							'border-color': `color-mix(in srgb, currentColor, transparent ${(1 - modifier) * 100}%)`
						}
				},
				{ values: { DEFAULT: '' }, modifiers: theme('opacity')! }
			)
		})
	]
} satisfies Config
