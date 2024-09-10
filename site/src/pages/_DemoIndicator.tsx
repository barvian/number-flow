import Demo, { type DemoProps } from '../components/Demo'
import useCycle from '../hooks/useCycle'
// import MotionNumber from 'motion-number'
// import { motion } from 'framer-motion'

const NUMBERS = [124.23, 41.75, 2125.95]
const DIFFS = [0.0564, -0.114, 0.0029]

export default function DemoIndicator({ children, ...rest }: DemoProps) {
	const [value, cycleValue] = useCycle(NUMBERS)
	const [diff, cycleDiff] = useCycle(DIFFS)

	function onClick() {
		cycleValue()
		cycleDiff()
	}

	return (
		<Demo {...rest} code={children} onClick={onClick}>
			<span className="flex items-center gap-2">
				{/* <MotionNumber
					value={value}
					className="~text-xl/4xl font-semibold [--mask-height:0.25em]"
					format={{ style: 'currency', currency: 'USD' }}
					style={{ lineHeight: 0.85 }}
					after={() => (
						<MotionNumber
							value={diff}
							className="~text-base/2xl px-[0.3em] font-semibold [--mask-height:0.3em]"
							format={{ style: 'percent', maximumFractionDigits: 2 }}
							animate={{ backgroundColor: diff > 0 ? '#34d399' : '#ef4444' }}
							style={{ borderRadius: 999, lineHeight: 0.85 }}
							initial={false}
							first={() => (
								<motion.svg
									className="mr-0.5 size-[0.75em] self-center"
									viewBox="0 0 24 24"
									strokeWidth="3"
									vectorEffect="non-scaling-stroke"
									stroke="currentColor"
									transition={{ rotate: { type: 'spring', duration: 0.5, bounce: 0 } }}
									animate={{ rotate: diff > 0 ? 0 : -180 }}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
									/>
								</motion.svg>
							)}
						/>
					)}
				/> */}
			</span>
		</Demo>
	)
}
