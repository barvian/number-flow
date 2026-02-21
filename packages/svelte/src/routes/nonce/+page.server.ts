import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'content-security-policy': "style-src 'self' 'nonce-test-nonce'"
	})
	return {}
}
