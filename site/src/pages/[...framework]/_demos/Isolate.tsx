import Demo, {
	DemoMenu,
	DemoMenuButton,
	DemoMenuItem,
	DemoMenuItems,
	type DemoProps
} from '@/components/Demo'
import NumberFlow from '@number-flow/react'
import * as React from 'react'

export default function DemoHOC({ ...rest }: Omit<DemoProps, 'children' | 'code'>) {
	const [increased, setIncreased] = React.useState(false)
	const [isolate, setIsolate] = React.useState(true)

	return (
		<Demo
			{...rest}
			title={
				<DemoMenu>
					<DemoMenuButton className="gap-1">
						<code className="text-muted">isolate:</code>
						<code className="font-semibold">{String(isolate)}</code>
					</DemoMenuButton>
					<DemoMenuItems>
						<DemoMenuItem onClick={() => setIsolate(true)} disabled={isolate}>
							<code className="font-semibold">true</code>
						</DemoMenuItem>
						<DemoMenuItem onClick={() => setIsolate(false)} disabled={!isolate}>
							<code className="font-semibold">false</code>
						</DemoMenuItem>
					</DemoMenuItems>
				</DemoMenu>
			}
			onClick={() => setIncreased((o) => !o)}
		>
			<div className="~text-xl/4xl flex items-center gap-4">
				{increased && <div className="bg-faint ~w-20/40 h-[1em] rounded-sm" />}
				<NumberFlow
					isolate={isolate}
					style={{ '--number-flow-line-height': '0.85em' }}
					value={increased ? 1.2423 : 0.4175}
					format={{ style: 'percent' }}
					className="font-semibold"
				/>
			</div>
		</Demo>
	)
}
