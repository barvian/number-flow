import webpack from 'webpack'
/** @type {import('next').NextConfig} */
const nextConfig = {
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
