import * as React from 'react'
import Demo, {
	DemoMenu,
	DemoMenuButton,
	DemoMenuItem,
	DemoMenuItems,
	type DemoProps
} from '@/components/Demo'
import NumberFlow, { type Trend } from '@number-flow/react'
import useCycle from '@/hooks/useCycle'

const NUMBERS = [20, 19]

const TRENDS = new Map<string, Trend | undefined>([
	['default', undefined],
	['+1', 1],
	['0', 0],
	['-1', -1]
])

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [value, cycleValue] = useCycle(NUMBERS)

	const [option, setOption] = React.useState<string>('default')
	const trend = TRENDS.get(option)
	const buttonId = React.useId()

	return (
		<Demo
			{...rest}
			title={
				<DemoMenu>
					<div className="flex items-stretch">
						<label htmlFor={buttonId} className="flex items-center ps-1">
							<code className="text-muted text-xs font-medium">trend:</code>
						</label>
						<div className="relative">
							<DemoMenuButton id={buttonId} className="gap-1">
								<code className="font-semibold">{option}</code>
							</DemoMenuButton>
							<DemoMenuItems>
								{TRENDS.keys()
									.map((key) => (
										<DemoMenuItem
											key={key}
											onClick={() => setOption(key)}
											disabled={option === key}
										>
											<code className="font-semibold">{key}</code>
										</DemoMenuItem>
									))
									.toArray()}
							</DemoMenuItems>
						</div>
					</div>
				</DemoMenu>
			}
			onClick={cycleValue}
		>
			<NumberFlow
				locales="en-US"
				trend={trend}
				value={value}
				className="~text-3xl/4xl text-primary font-semibold"
				style={{ '--number-flow-char-height': '0.85em' }}
			/>
		</Demo>
	)
}
