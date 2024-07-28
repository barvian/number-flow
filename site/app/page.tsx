'use client'

import * as React from 'react'
import NumberRoll from '@number-roll/react'

function getRandom(min: number, max: number) {
	return Math.random() * (max - min) + min
}

export default function Home() {
	const [value, setValue] = React.useState(12313.4)
	const [locale, setLocale] = React.useState(true)

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<span className="flex items-baseline gap-3">
				<span className="text-3xl/normal">
					<NumberRoll
						value={value}
						format={{ useGrouping: locale ? 'always' : false }}
					></NumberRoll>
				</span>
				{/* <span>$00{value}</span> */}
			</span>
			<button onClick={() => setLocale((l) => !l)}>Change locale</button>
			<button
				onClick={
					() => setValue((v) => (v === 12313.4 ? 1213 : 12313.4))
					// setValue((v) => (v === 12313.4 ? 1213258921.49 : v === 12121.4 ? 1.4 : 12313.4))
				}
			>
				Change value
			</button>
		</main>
	)
}
