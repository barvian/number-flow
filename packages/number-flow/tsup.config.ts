import { defineConfig } from 'tsup'

export default defineConfig({
	sourcemap: false,
	entry: ['src/index.tsx', 'src/lazy.tsx'],
	external: ['./styles.css'],
	clean: true,
	minify: false,
	dts: true,
	format: ['esm', 'cjs']
})
