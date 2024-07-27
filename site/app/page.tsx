'use client'

import * as React from 'react'
import NumberRoll from '@number-roll/react'

export default function Home() {
	const [value, setValue] = React.useState(123.4)
	const [locale, setLocale] = React.useState(true)

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<span className="flex gap-3">
				<span className="text-3xl/snug">
					<NumberRoll
						value={value}
						format={{ useGrouping: locale ? 'always' : false }}
					></NumberRoll>
				</span>
				<span>$00{value}</span>
			</span>
			<button onClick={() => setLocale((l) => !l)}>Change locale</button>
			<button
				onClick={() => setValue((v) => (v === 123.4 ? 12121.45 : v === 12121.4 ? 1.4 : 123.4))}
			>
				Change value
			</button>
		</main>
	)
}
