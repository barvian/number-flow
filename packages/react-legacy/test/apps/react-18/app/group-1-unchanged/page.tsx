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
				<NumberFlowGroup>
					<NumberFlow ref={ref1} value={value} />
					<NumberFlow ref={ref2} value={0} />
				</NumberFlowGroup>
			</div>
			<button
				onClick={() => {
					flushSync(() => {
						setValue(152000)
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
