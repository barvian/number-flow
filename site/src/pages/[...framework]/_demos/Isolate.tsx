import Demo, { type DemoProps } from '@/components/Demo'
import NumberFlow from '@number-flow/react'
import * as React from 'react'

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [on, setOn] = React.useState(false)

	return (
		<Demo {...rest} onClick={() => setOn((o) => !o)}>
			<code>{'isolate'}</code>
			<div className="mb-4 h-5 space-x-1">
				{on && <span>Increased:</span>}
				<NumberFlow
					className="font-[inherit] tracking-tight"
					isolate
					value={on ? 1.2423 : 0.4175}
					format={{ style: 'percent' }}
				/>
			</div>
			<span className="text-center">
				<code>{'isolate={false}'}</code> (default)
			</span>
			<div className="h-5 space-x-1">
				{on && <span>Increased:</span>}
				<NumberFlow
					className="font-[inherit] tracking-tight"
					value={on ? 1.2423 : 0.4175}
					format={{ style: 'percent' }}
				/>
			</div>
		</Demo>
	)
}
