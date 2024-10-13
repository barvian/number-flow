import type { Config } from 'tailwindcss'
import reset from 'tw-reset'
import fluid, { extract, fontSize, screens, type FluidThemeConfig } from 'fluid-tailwind'
import typography from '@tailwindcss/typography'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'
import spring from 'tailwindcss-spring'
import type { PluginUtils } from 'tailwindcss/types/config'

const sans = ['Inter', '_font_fallback_732902278794', 'sans-serif']

export default {
	presets: [reset()],
	content: {
		files: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
		transform: {
			mdx: (src) =>
				src
					// Ignore classes in code blocks
					.replace(/```.*?```/gs, '')
					// Only return stuff in <component>s
					.match(/<[^/].*?>/g)
					?.join() ?? ''
		},
		extract
	},
	corePlugins: {
		container: false
	},
	darkMode: ['variant', ['@media (prefers-color-scheme: dark) { & }', '&:where(.dark *)']],
	theme: {
		screens,
		fontSize,
		fontFamily: {
			sans,
			'mac-ui': ['-apple-system', 'BlinkMacSystemFont', ...sans],
			mono: defaultTheme.fontFamily.mono
		},
		fluid: (({ theme }) => ({
			defaultScreens: [, theme('screens.md')]
		})) satisfies FluidThemeConfig,
		extend: {
			boxShadow: {
				px: '0 0 0 1px rgb(0 0 0 / 0.05)'
			},
			colors: {
				framework: 'var(--color-framework)',
				zinc: {
					125: '##f0f0f1',
					150: '#ececee',
					850: '#1f1f22'
				}
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
				'pop-in': 'pop-in .11s ease'
			},
			screens: {
				xs: '20rem',
				xl: '74rem'
			},
			spacing: {
				'4.5': '1.125rem',
				18: '4.5rem'
			},
			opacity: {
				'12.5': '12.5%'
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
						'line-height': '1.7',

						a: {
							'@apply link-underline font-normal': {}
						},

						hr: {
							'@apply my-[2em]': {}
						},

						'code::before': {
							content: 'none'
						},

						'code::after': {
							content: 'none'
						},

						h2: {
							'@apply font-semibold text-xl': {}
						},

						h3: {
							'@apply font-semibold text-base': {},
							'margin-top': '2.4em',
							'margin-bottom': '1em'
						},

						h4: {
							'@apply font-semibold': {},
							'margin-bottom': '0.7em',
							'margin-top': '1.25em'
						},

						'[role=alert]': {
							'@apply my-[1.25em]': {}
						},

						'[role=alert] > :first-child': {
							'margin-top': '0 !important'
						},
						'[role=alert] > :last-child': {
							'margin-bottom': '0 !important'
						},

						// We need to always use padding for the IntersectionObserver to work:
						'&>section,&>footer': {
							'@apply py-10 first:pt-0 last:pb-0': {}
						},
						'section > :first-child, footer > :first-child': {
							'margin-top': '0 !important'
						},
						'section > :last-child, footer > :last-child': {
							'margin-bottom': '0 !important'
						}
					}
				},
				zinc: {
					css: {
						'--tw-prose-links': theme('colors.zinc.950'),
						'--tw-prose-invert-links': theme('colors.zinc.50'),
						'--tw-prose-code': theme('colors.zinc.950'),
						'--tw-prose-invert-code': theme('colors.zinc.50'),
						'--tw-prose-headings': theme('colors.zinc.950'),
						'--tw-prose-invert-headings': theme('colors.zinc.50'),
						'--tw-prose-invert-hr': theme('colors.zinc.900'),
						'--tw-prose-invert-body': theme('colors.zinc.300')
					}
				},
				muted: {
					css: {
						'--tw-prose-body': theme('colors.zinc.500'),
						'--tw-prose-invert-body': theme('colors.zinc.400'),
						// '--tw-prose-links': 'currentColor',
						// '--tw-prose-invert-links': 'currentColor',
						'--tw-prose-links': theme('colors.zinc.600'),
						'--tw-prose-invert-links': theme('colors.zinc.400')
					}
				}
			})
		}
	},
	plugins: [
		spring,
		fluid,
		typography,
		plugin(({ matchUtilities, addVariant, theme }) => {
			matchUtilities(
				{
					vt: (_, { modifier }) => ({
						'view-transition-name': modifier
					})
				},
				{ values: { DEFAULT: '' }, modifiers: 'any' }
			)

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

			addVariant('pre-first-line', ['pre& .line:first-of-type', '& pre .line:first-of-type'])
			addVariant('prefers-dark', ['@media (prefers-color-scheme: dark) { & }'])
		})
	]
} satisfies Config
