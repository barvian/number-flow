'use client'

import * as React from 'react'
import NumberRoll from '@number-roll/react'

export default function Home() {
	const [value, setValue] = React.useState(123.4)
	const [locale, setLocale] = React.useState('en-US')

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<NumberRoll locales={locale}>{value}</NumberRoll>
			<button onClick={() => setLocale((l) => (l === 'en-US' ? 'fr-FR' : 'en-US'))}>
				Change locale
			</button>
			<button onClick={() => setValue((v) => (v === 123.4 ? 133.4 : 123.4))}>Change value</button>
		</main>
	)
}
