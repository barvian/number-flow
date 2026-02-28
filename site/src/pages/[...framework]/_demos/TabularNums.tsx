import Demo, { DemoSwitch, type DemoProps } from '@/components/Demo'
import NumberFlow from '@number-flow/react'
import * as React from 'react'

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [value, setValue] = React.useState(10)
	const [tabularNums, setTabularNums] = React.useState(false)

	return (
		<Demo
			{...rest}
			title={
				<DemoSwitch isSelected={tabularNums} onChange={setTabularNums}>
					<code className="font-semibold">tabular-nums</code>
				</DemoSwitch>
			}
			onClick={() => setValue((v) => v + 1)}
		>
			<div className="~text-3xl/4xl flex items-center gap-4">
				<NumberFlow
					locales="en-US"
					style={{
						fontVariantNumeric: tabularNums ? 'tabular-nums' : undefined
					}}
					value={value}
					className="font-semibold"
				/>
			</div>
		</Demo>
	)
}
