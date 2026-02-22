import webpack from 'webpack'
import { createHash } from 'node:crypto'
import { styles } from '@number-flow/react'

const nonceCsp = "style-src 'nonce-test-nonce'"
const hashesCsp = `style-src ${styles.map((style) => `'sha256-${createHash('sha256').update(style).digest('base64')}'`).join(' ')}`
/** @type {import('next').NextConfig} */
const nextConfig = {
	async headers() {
		return [
			{
				source: '/nonce',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: nonceCsp
					}
				]
			},
			{
				source: '/hashes',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: hashesCsp
					}
				]
			}
		]
	},
	webpack(config, context) {
		config.plugins.push(
			new webpack.DefinePlugin({
				__REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })'
			})
		)
		return config
	}
}

export default nextConfig
