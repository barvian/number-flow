'use client'

import * as React from 'react'
import NumberFlow, { NumberFlowElement } from '@number-flow/react'
import { flushSync } from 'react-dom'

export default function Page() {
	const [state, setState] = React.useState({ value: 42, animated: false })
	const ref = React.useRef<NumberFlowElement>(null)
	return (
		<>
			<div>
				<NumberFlow
					id="flow1"
					data-testid="flow1"
					ref={ref}
					value={state.value}
					animated={state.animated}
					transformTiming={{ easing: 'linear', duration: 500 }}
					spinTiming={{ easing: 'linear', duration: 800 }}
					opacityTiming={{ easing: 'linear', duration: 500 }}
				/>
			</div>
			<button
				onClick={() => {
					// Change the value and enable animations in the same update:
					flushSync(() => {
						setState({ value: 152, animated: true })
					})
					;(ref.current?.shadowRoot?.getAnimations() ?? []).forEach((a) => {
						a.pause()
						a.currentTime = 300
					})
				}}
			>
				Change and pause
			</button>
		</>
	)
}
