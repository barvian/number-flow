import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import typescript from '@rollup/plugin-typescript'

export default defineConfig(({ mode }) => ({
	plugins: [vue()],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.vue'),
			name: 'NumberFlow',
			fileName: 'index'
		},
		rollupOptions: {
			external: ['vue', 'number-flow'],
			plugins: [
				typescript({
					tsconfig: resolve(__dirname, `tsconfig${mode === 'production' ? '.build' : ''}.json`)
				})
			],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					vue: 'Vue'
				}
			}
		}
	}
}))
