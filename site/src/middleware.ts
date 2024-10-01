import type { MiddlewareHandler } from 'astro'
import { urlAtom, pageFrameworkAtom } from '@/stores/url'
import { getFramework } from '@/lib/framework'

export const onRequest: MiddlewareHandler = ({ url, params }, next) => {
	// Expose the request URL for framework components SSR (equivalent to Astro.url in Astro component)
	urlAtom.set(url)
	pageFrameworkAtom.set(getFramework(params))

	return next()
}
