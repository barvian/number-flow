import type { PageServerLoad } from './$types'
import { createHash } from 'node:crypto'
import { styles } from '$lib/index.js'

const hash = (style: string) => `'sha256-${createHash('sha256').update(style).digest('base64')}'`

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'Content-Security-Policy': `style-src ${styles.map(hash).join(' ')}`
	})
	return {}
}
