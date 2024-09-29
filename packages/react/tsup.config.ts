import { defineConfig } from 'tsup'

export default defineConfig({
	sourcemap: false,
	entry: ['src/index.tsx', 'src/framer-motion.ts'],
	clean: true,
	minify: false,
	dts: true,
	format: ['esm', 'cjs']
})
