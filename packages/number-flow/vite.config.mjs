import { resolve } from 'path'
import { defineConfig, createFilter } from 'vite'
import typescript from '@rollup/plugin-typescript'
// import minifyLiterals from 'rollup-plugin-minify-html-literals-v3'
import { minifyRaw as minifyCSS } from 'babel-plugin-styled-components/lib/minify'
import MagicString from 'magic-string'
import * as pl from 'parse-literals'

const outDir = resolve(__dirname, 'dist')

export default defineConfig(({ mode }) => ({
	build: {
		outDir,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es', 'cjs'],
			fileName: 'index'
		},
		rollupOptions: {
			external: ['esm-env'],
			plugins: [
				// Caused issues with CSS:
				// minifyLiterals({
				// 	// Couldn't get the plugin to work with css``, so disable it and handle it separately:
				// 	minifyOptions: {
				// 		minifyCSS: false
				// 	}
				// }),
				minifyCSSLiterals(),
				typescript({
					tsconfig: resolve(__dirname, `./tsconfig${mode === 'production' ? '.build' : ''}.json`)
				})
			]
		}
	}
}))

/** @satisfies {import('vite').Plugin} */
function minifyCSSLiterals() {
	const filter = createFilter(/\.[jt]sx?$/)

	return {
		name: 'vite-plugin-minify-css-literals',
		enforce: 'pre',
		apply: 'build',
		transform(code, id) {
			if (!filter(id)) return null

			const templates = pl.parseLiterals(code)
			if (!templates.length) return code

			const ms = new MagicString(code)
			templates.forEach((template) => {
				if (template.tag !== 'css') return
				template.parts.forEach((part) => {
					if (part.start < part.end) {
						const mini = minifyCSS(part.text)[0]
							.replaceAll(';}', '}')
							// .replaceAll(/\s+!important/g, '!important')
							.replaceAll(/linear-gradient\(\s+/g, 'linear-gradient(')
						ms.overwrite(part.start, part.end, mini)
					}
				})
			})

			return {
				code: ms.toString(),
				map: ms.generateMap({ hires: 'boundary' })
			}
		}
	}
}
