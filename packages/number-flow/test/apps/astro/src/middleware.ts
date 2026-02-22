import { defineMiddleware } from 'astro:middleware'
import { createHash } from 'node:crypto'
import { styles } from 'number-flow'

const nonceCsp = "style-src 'nonce-test-nonce'"
const hash = (style: string) => `'sha256-${createHash('sha256').update(style).digest('base64')}'`
const hashesCsp = `style-src ${styles.map(hash).join(' ')}`

export const onRequest = defineMiddleware(async ({ url }, next) => {
	const response = await next()
	if (url.pathname === '/nonce') {
		response.headers.set('Content-Security-Policy', nonceCsp)
	}
	if (url.pathname === '/hashes') {
		response.headers.set('Content-Security-Policy', hashesCsp)
	}
	return response
})
