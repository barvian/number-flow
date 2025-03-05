import type { Config } from 'tailwindcss'
import reset from 'tw-reset'
import fluid, { extract, fontSize, screens, type FluidThemeConfig } from 'fluid-tailwind'
import typography from '@tailwindcss/typography'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'
// @ts-expect-error types not working
import spring from 'tailwindcss-spring'
import type { PluginUtils } from 'tailwindcss/types/config'

const sans = ['Inter', '_font_fallback_732902278794', 'sans-serif']

export default {
	presets: [reset({ hoverOnlyWhenSupported: true })],
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
				accent: 'var(--accent)',
				zinc: {
					125: '##f0f0f1',
					150: '#ececee',
					850: '#1f1f22'
				}
			},
			keyframes: {
				'logo-wall': {
					to: {
						transform: 'translateX(-100%)'
					}
				},
				'pop-in': {
					from: {
						opacity: '0',
						transform: 'scale(.96)'
					}
				}
			},
			animation: {
				'logo-wall': 'logo-wall 40s linear infinite',
				'pop-in': 'pop-in .11s ease'
			},
			screens: {
				xs: '20rem',
				xl: '74rem'
			},
			spacing: {
				'4.5': '1.125rem',
				'5.5': '1.375rem',
				'11.5': '2.875rem',
				'16.5': '4.125rem',
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

						th: {
							'@apply font-semibold': {}
						},

						a: {
							'font-weight': 'unset',
							'@apply link-underline': {}
						},

						hr: {
							'@apply my-16 border-faint': {}
						},

						'code::before': {
							content: 'none'
						},

						'code a': {
							'@apply text-muted': {}
						},

						summary: {
							'@apply font-medium text-[--tw-prose-links] cursor-pointer': {}
						},

						'code::after': {
							content: 'none'
						},

						h2: {
							'@apply mt-16 mb-[1.25em] font-semibold text-xl': {}
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

						blockquote: {
							'@apply border-faint': {}
						},

						'[role=alert]': {
							'@apply my-[1.25em]': {}
						},

						'[role=alert] > :first-child': {
							'margin-top': '0 !important'
						},
						'[role=alert] > :last-child': {
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
				},
				current: {
					css: {
						'--tw-prose-links': 'currentColor',
						'--tw-prose-invert-links': 'currentColor'
					}
				}
			})
		}
	},
	plugins: [
		spring,
		fluid,
		typography,
		plugin(({ matchUtilities, addUtilities, addVariant, matchVariant, theme }) => {
			matchUtilities(
				{
					vt: (_, { modifier }) => ({
						'view-transition-name': modifier
					})
				},
				{ values: { DEFAULT: '' }, modifiers: 'any' }
			)

			matchVariant('part', (p) => `:root[data-supports-dsd] &::part(${p})`)

			matchUtilities(
				{
					fluid: (val) => ({
						'--fluid': val
					})
				},
				{ values: theme('spacing') }
			)

			const resolveOpacity = (opacity: string | number) => {
				const num = typeof opacity === 'string' ? parseFloat(opacity) : opacity
				if (!isNaN(num)) return `${num * 100}%`
				return opacity
			}
			matchUtilities(
				{
					'text-current': (_, { modifier }) =>
						modifier && {
							color: `color-mix(in srgb, transparent, currentColor ${resolveOpacity(modifier)})`
						},
					'decoration-current': (_, { modifier }) =>
						modifier && {
							'text-decoration-color': `color-mix(in srgb, transparent, currentColor ${resolveOpacity(modifier)})`
						},
					'border-current': (_, { modifier }) =>
						modifier && {
							'border-color': `color-mix(in srgb, transparent, currentColor ${resolveOpacity(modifier)})`
						}
				},
				{ values: { DEFAULT: '' }, modifiers: theme('opacity')! }
			)

			addUtilities({
				'.border-faint': {
					'@apply border-zinc-150 dark:border-zinc-800': {}
				}
			})

			addVariant('pre-first-line', ['pre& .line:first-of-type', '& pre .line:first-of-type'])
			addVariant('prefers-dark', ['@media (prefers-color-scheme: dark) { & }'])
		})
	]
} satisfies Config
