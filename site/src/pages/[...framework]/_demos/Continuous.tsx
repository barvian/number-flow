import Demo, { DemoSwitch, type DemoProps } from '@/components/Demo'
import NumberFlow from '@number-flow/react'
import * as React from 'react'
import useCycle from '@/hooks/useCycle'

const NUMBERS = [120, 140]

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [value, cycleValue] = useCycle(NUMBERS)
	const [continuous, setContinuous] = React.useState(false)

	return (
		<Demo
			{...rest}
			title={
				<DemoSwitch checked={continuous} onChange={setContinuous}>
					<code className="font-semibold">continuous</code>
				</DemoSwitch>
			}
			onClick={cycleValue}
		>
			<div className="~text-xl/4xl flex items-center gap-4">
				<NumberFlow
					continuous={continuous}
					style={{ '--number-flow-char-height': '0.85em' }}
					value={value}
					className="font-semibold"
				/>
			</div>
		</Demo>
	)
}
