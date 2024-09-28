import { motion } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import { ArrowUp } from 'lucide-react'

const MotionNumberFlow = motion.create(NumberFlow)
const MotionArrowUp = motion.create(ArrowUp)

type Props = {
	value: number
	diff: number
}

export default function FramerMotionExample({ value, diff }: Props) {
	return (
		<span className="flex items-center gap-2 [--number-flow-char-height:0.85em]">
			<MotionNumberFlow
				value={value}
				className="~text-xl/4xl font-semibold [--number-flow-mask-height:0.25em]"
				format={{ style: 'currency', currency: 'USD' }}
			/>
			<motion.span
				animate={{ backgroundColor: diff > 0 ? '#34d399' : '#ef4444' }}
				initial={false}
				className="~text-base/2xl inline-flex items-center px-[0.3em]"
				style={{ borderRadius: 999 }}
				layout
				transition={{ layout: { type: 'spring', duration: 0.9, bounce: 0 } }}
			>
				<MotionArrowUp
					className="mr-0.5 size-[0.75em]"
					absoluteStrokeWidth
					strokeWidth={3}
					transition={{ rotate: { type: 'spring', duration: 0.5, bounce: 0 } }}
					animate={{ rotate: diff > 0 ? 0 : -180 }}
					initial={false}
				/>
				<MotionNumberFlow
					layout
					layoutRoot
					value={diff}
					className="font-semibold [--number-flow-mask-height:0.3em]"
					format={{ style: 'percent', maximumFractionDigits: 2 }}
					style={{ borderRadius: 999 }}
				/>
			</motion.span>
		</span>
	)
}
