import Demo, { DemoSwitch, type DemoProps } from '@/components/Demo'
import NumberFlow from '@number-flow/react'
import * as React from 'react'

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [increased, setIncreased] = React.useState(false)
	const [isolate, setIsolate] = React.useState(false)

	return (
		<Demo
			{...rest}
			title={
				<DemoSwitch checked={isolate} onChange={setIsolate}>
					<code className="font-semibold">isolate</code>
				</DemoSwitch>
			}
			onClick={() => setIncreased((o) => !o)}
		>
			<div className="~text-3xl/4xl flex items-center gap-4">
				{increased && <div className="bg-faint ~w-20/40 h-[1em] rounded-sm" />}
				<NumberFlow
					isolate={isolate}
					style={{ '--number-flow-char-height': '0.85em' }}
					value={increased ? 1.2423 : 0.4175}
					format={{ style: 'percent' }}
					className="font-semibold"
				/>
			</div>
		</Demo>
	)
}
