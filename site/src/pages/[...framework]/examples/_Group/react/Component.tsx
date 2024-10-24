import { motion } from 'framer-motion'
import NumberFlow, { useCanAnimate } from '@number-flow/react'
import { ArrowUp } from 'lucide-react'
import clsx from 'clsx/lite'

const MotionNumberFlow = motion.create(NumberFlow)
const MotionArrowUp = motion.create(ArrowUp)

type Props = {
	value: number
	diff: number
}

export default function PriceWithDiff({ value, diff }: Props) {
	// Disable layout animations if NumberFlow can't animate:
	const canAnimate = useCanAnimate()

	return (
		<span style={{ '--number-flow-char-height': '0.85em' }} className="flex items-center gap-2">
			<NumberFlow
				value={value}
				className="~text-xl/4xl font-semibold"
				format={{ style: 'currency', currency: 'USD' }}
			/>
			<motion.span
				className={clsx(
					diff > 0 ? 'bg-emerald-400' : 'bg-red-500',
					'~text-base/2xl inline-flex items-center px-[0.3em] text-white transition-colors duration-300'
				)}
				style={{ borderRadius: 999 }}
				layout={canAnimate}
				transition={{ layout: { duration: 0.9, bounce: 0, type: 'spring' } }}
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
					value={diff}
					className="font-semibold"
					format={{ style: 'percent', maximumFractionDigits: 2 }}
					style={{ '--number-flow-mask-height': '0.3em' }}
					// Important, see note below:
					layout={canAnimate}
					layoutRoot={canAnimate}
				/>
			</motion.span>
		</span>
	)
}
