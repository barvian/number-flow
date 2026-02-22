import type { NextConfig } from 'next'
import webpack from 'webpack'
import { createHash } from 'node:crypto'
import { styles } from '@number-flow/react'

const nonceCsp = "style-src 'nonce-test-nonce'"
const hash = (style: string) => `'sha256-${createHash('sha256').update(style).digest('base64')}'`
const hashesCsp = `style-src ${styles.map(hash).join(' ')}`

const nextConfig: NextConfig = {
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
	},
	devIndicators: {
		appIsrStatus: false
	}
}

export default nextConfig
