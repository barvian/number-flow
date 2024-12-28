import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

const outDir = resolve(__dirname, 'dist')

export default defineConfig(({ mode }) => ({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: (tag) => tag === 'number-flow-vue'
				}
			}
		}),
		dts({
			tsconfigPath: resolve(__dirname, `./tsconfig${mode === 'production' ? '.build' : ''}.json`),
			rollupTypes: true,
			include: ['src']
		})
	],
	build: {
		outDir,
		lib: {
			name: 'number-flow-vue', // required for UMD build
			entry: {
				index: resolve(__dirname, 'src/index.ts')
			},
			fileName: (format, name) => {
				return `${name}.${format === 'es' ? 'js' : 'umd.cjs'}`
			}
		},
		rollupOptions: {
			external: ['vue', 'number-flow', 'esm-env'],
			output: {
				// Names for UMD builds
				globals: {
					vue: 'Vue',
					'esm-env': 'Env',
					'number-flow': 'NumberFlow'
				},
				exports: 'named'
			}
		}
	}
}))
