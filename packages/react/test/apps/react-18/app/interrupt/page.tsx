'use client'

import * as React from 'react'
import NumberFlow, { NumberFlowElement, type Format } from '@number-flow/react'
import { flushSync } from 'react-dom'

// Cycles through formats that add, remove, then re-add symbols
// (accounting parens, currency, signs):
const CYCLE: [number, Format][] = [
	[431.1, { minimumFractionDigits: 2 }],
	[
		-3243.6,
		{ style: 'currency', currency: 'USD', currencySign: 'accounting', signDisplay: 'always' }
	],
	// Swaps the parens/currency for a minus sign (and back), so symbols
	// get added and removed in the same section simultaneously:
	[-3243.5, {}],
	[
		-3243.6,
		{ style: 'currency', currency: 'USD', currencySign: 'accounting', signDisplay: 'always' }
	]
]

// Per-click pause times: pause the pops late (so mispositioned exiting
// symbols would have visibly drifted), then the reclaims early (so
// they'd render at the drifted positions):
const PAUSES = [900, 900, 450]

export default function Page() {
	const [i, setI] = React.useState(0)
	const ref = React.useRef<NumberFlowElement>(null)

	const [value, format] = CYCLE[i % CYCLE.length]!
	return (
		<>
			<button
				onClick={() => {
					const next = i + 1
					flushSync(() => {
						setI(next)
					})
					ref.current?.shadowRoot?.getAnimations().forEach((a) => {
						// Leave previously-paused rounds where they are:
						if (a.playState === 'paused') return
						a.pause()
						a.currentTime = PAUSES[(next - 1) % PAUSES.length]!
					})
				}}
			>
				Cycle and pause
			</button>
			<div>
				Text node{' '}
				<NumberFlow
					ref={ref}
					value={value}
					format={format}
					transformTiming={{ duration: 900, easing: 'linear' }}
					opacityTiming={{ duration: 900, easing: 'linear' }}
				/>
			</div>
		</>
	)
}
