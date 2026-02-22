import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'Content-Security-Policy': "style-src 'none' 'nonce-test-nonce'"
	})
	return {}
}
