'use client'

import * as React from 'react'
import NumberRoll from '@number-roll/react'

export default function Home() {
	const [value, setValue] = React.useState(123.4)
	const [locale, setLocale] = React.useState('en-US')

	return (
		<main className="flex min-h-screen flex-col items-start justify-between p-24">
			<span className="flex gap-3">
				<span className="text-3xl/snug">
					<NumberRoll
						locales={locale}
						format={{ style: 'decimal', currency: 'USD', maximumFractionDigits: 3 }}
					>
						{value}
					</NumberRoll>
				</span>
				<span>${value}</span>
			</span>
			<button onClick={() => setLocale((l) => (l === 'en-US' ? 'fr-FR' : 'en-US'))}>
				Change locale
			</button>
			<button onClick={() => setValue((v) => (v === 123.4 ? 12121.4 : 123.4))}>Change value</button>
		</main>
	)
}
