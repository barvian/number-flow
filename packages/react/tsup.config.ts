import { defineConfig } from 'tsup'

export default defineConfig({
	sourcemap: false,
	entry: ['src/*'],
	outDir: 'dist',
	clean: true,
	minify: false,
	dts: true,
	format: ['esm', 'cjs']
})
