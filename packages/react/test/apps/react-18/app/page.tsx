'use client'

import * as React from 'react'
import NumberFlow, { NumberFlowElement } from '@number-flow/react'
import { flushSync } from 'react-dom'

export default function Page() {
	const [value, setValue] = React.useState(42)
	const ref = React.useRef<NumberFlowElement>(null)
	return (
		<>
			<div>
				Text node{' '}
				<NumberFlow
					ref={ref}
					value={value}
					format={{ style: 'currency', currency: 'USD' }}
					locales="fr-FR"
					trend="increasing"
					prefix=":"
					suffix="/mo"
					continuous
					onAnimationsStart={() => console.log('start')}
					onAnimationsFinish={() => console.log('finish')}
					transformTiming={{ easing: 'linear', duration: 500 }}
					spinTiming={{ easing: 'linear', duration: 800 }}
					opacityTiming={{ easing: 'linear', duration: 500 }}
				/>
			</div>
			<button
				onClick={() => {
					flushSync(() => {
						setValue(152)
					})
					ref.current?.shadowRoot?.getAnimations().forEach((a) => {
						a.pause()
						a.currentTime = 300
					})
				}}
			>
				Change and pause
			</button>
			<br />
			<button
				onClick={() => {
					ref.current?.shadowRoot?.getAnimations().forEach((a) => {
						a.play()
					})
				}}
			>
				Resume
			</button>
		</>
	)
}
