import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async ({ url }, next) => {
	const response = await next()
	if (url.pathname === '/nonce') {
		response.headers.set('Content-Security-Policy', "style-src 'none' 'nonce-test-nonce'")
	}
	return response
})
