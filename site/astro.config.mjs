import { defineConfig, envField } from 'astro/config'
import pkg from '/../packages/number-flow/package.json'
import mdx from '@astrojs/mdx'
import vercel from '@astrojs/vercel'
import shikiTheme from './highlighter-theme.json'
import react from '@astrojs/react'
import vue from '@astrojs/vue'
import svelte from '@astrojs/svelte'

// https://astro.build/config
export default defineConfig({
	site: pkg.homepage,
	markdown: {
		shikiConfig: {
			// @ts-ignore
			theme: shikiTheme
		}
	},
	vite: {
		plugins: [
			{
				name: 'transform-vanilla-examples',
				transform(code, id) {
					// Make .astro examples look like valid HTML:
					if (id.endsWith('.astro?raw')) {
						return (
							code
								.replaceAll('<script>', '<script type=\\"module\\">')
								// Remove @ts-nocheck comments
								.replaceAll(/(\\t)*\/\/ @ts-nocheck\\n/g, '')
								.replaceAll(/(\\t)*\/\/ prettier-ignore\\n/g, '')
								// Clean up IDs
								.replaceAll(/vanilla-example-.*?-/g, '')
						)
					}
				}
			}
		],
		ssr: {
			// Fixes build issue on macOS
			external: ['fsevents']
		}
	},
	env: {
		schema: {
			GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret' })
		}
	},
	experimental: {
		svg: true
	},
	integrations: [
		react(),
		mdx(),
		{
			name: 'watch-shiki-theme',
			hooks: {
				'astro:config:setup'({ addWatchFile, config }) {
					addWatchFile(new URL('./highlighter-theme.json', config.root))
				}
			}
		},
		vue({
			template: {
				compilerOptions: {
					// isCustomElement: (tag) => tag === 'number-flow'
				}
			}
			// ...
		}),
		svelte()
	],
	output: 'static',
	adapter: vercel({
		webAnalytics: {
			enabled: true
		}
	})
})
