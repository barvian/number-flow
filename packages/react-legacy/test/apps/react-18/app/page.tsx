'use client'

import * as React from 'react'
import NumberFlow, { NumberFlowElement, NumberFlowGroup } from '@number-flow/react'
import { flushSync } from 'react-dom'

export default function Page() {
	const [value, setValue] = React.useState(42)
	const ref1 = React.useRef<NumberFlowElement>(null)
	const ref2 = React.useRef<NumberFlowElement>(null)
	return (
		<>
			<div>
				Text node{' '}
				<NumberFlowGroup>
					<NumberFlow
						ref={ref1}
						value={value}
						format={{ style: 'currency', currency: 'USD' }}
						locales="zh-CN"
						trend={() => -1}
						prefix=":"
						suffix="/mo"
						data-testid="flow1"
						onAnimationsStart={() => console.log('start')}
						onAnimationsFinish={() => console.log('finish')}
						transformTiming={{ easing: 'linear', duration: 500 }}
						spinTiming={{ easing: 'linear', duration: 800 }}
						opacityTiming={{ easing: 'linear', duration: 500 }}
					/>
					<NumberFlow
						ref={ref2}
						value={value}
						respectMotionPreference={false}
						data-testid="flow2"
						continuous
						digits={{ 0: { max: 2 } }}
						transformTiming={{ easing: 'linear', duration: 500 }}
						spinTiming={{ easing: 'linear', duration: 800 }}
						opacityTiming={{ easing: 'linear', duration: 500 }}
					/>
				</NumberFlowGroup>
			</div>
			<button
				onClick={() => {
					flushSync(() => {
						setValue(152)
					})
					;[
						...(ref1.current?.shadowRoot?.getAnimations() ?? []),
						...(ref2.current?.shadowRoot?.getAnimations() ?? [])
					].forEach((a) => {
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
					;[
						...(ref1.current?.shadowRoot?.getAnimations() ?? []),
						...(ref2.current?.shadowRoot?.getAnimations() ?? [])
					].forEach((a) => {
						a.play()
					})
				}}
			>
				Resume
			</button>
		</>
	)
}
