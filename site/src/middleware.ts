import type { MiddlewareHandler } from 'astro'
import { $url, $pageFramework } from '@/stores/url'
import { getFramework } from '@/lib/framework'

export const onRequest: MiddlewareHandler = ({ url, params }, next) => {
	// Expose the request URL for framework components SSR (equivalent to Astro.url in Astro component)
	$url.set(url)
	$pageFramework.set(getFramework(params))

	return next()
}
