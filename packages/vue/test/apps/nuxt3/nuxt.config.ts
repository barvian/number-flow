import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: { enabled: false },
	srcDir: 'src/',
	devServer: {
		port: 3039
	},
	routeRules: {
		'/nonce': {
			headers: {
				'Content-Security-Policy': "style-src 'none' 'nonce-test-nonce'"
			}
		}
	},
	modules: ['@nuxt/fonts'],
	css: [
		// CSS file in the project
		'~/assets/css/main.css'
	],
	imports: {
		// Breaks stuff b/c monorepo?
		// https://github.com/nuxt/nuxt/issues/18823
		autoImport: false
	},
	fonts: {
		defaults: {
			weights: [400],
			styles: ['normal'],
			subsets: ['latin']
		},
		experimental: {
			disableLocalFallbacks: true
		}
	},
	vite: {
		plugins: [tailwindcss()]
	}
})
