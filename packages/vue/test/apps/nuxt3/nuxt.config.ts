// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	devtools: { enabled: false },
	srcDir: 'src/',
	devServer: {
		port: 3039
	},
	modules: ['@nuxt/fonts'],
	fonts: {
		defaults: {
			weights: [400],
			styles: ['normal'],
			subsets: ['latin']
		},
		experimental: {
			disableLocalFallbacks: true
		}
	}
})
