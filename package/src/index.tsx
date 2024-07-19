import * as React from 'react'
import { AnimatePresence, motion, type MotionProps } from 'framer-motion'

// Merge the sign types
type NumberPartType = Exclude<Intl.NumberFormatPartTypes, 'minusSign' | 'plusSign'> | 'sign'

// Reverse the layout animations for these number part types:
const REVERSE_TYPES: Intl.NumberFormatPartTypes[] = ['integer', 'group']

export default function NumberRoll({
	children,
	locales = typeof window !== 'undefined' ? window.navigator.language : undefined, // Int.NumberFormat defaults to the runtime's default locale
	format
}: {
	children: number | bigint | string
	locales?: Intl.LocalesArgument
	format?: Intl.NumberFormatOptions
}) {
	// Split the number into parts
	const parts = React.useMemo(() => {
		const formatter = new Intl.NumberFormat(locales, format)
		const parts = formatter.formatToParts(children)
		if (parts.find((part) => part.type === 'nan')) return null

		const counts: Partial<Record<NumberPartType, number>> = {}
		return parts.flatMap<
			| { type: NumberPartType & ('integer' | 'fraction'); value: number; key: string }
			| { type: Exclude<NumberPartType, 'integer' | 'fraction'>; value: string; key: string }
		>((part) => {
			// Merge the sign types
			const type: NumberPartType =
				part.type === 'minusSign' || part.type === 'plusSign' ? 'sign' : part.type

			if (counts[type] == null)
				counts[type] = REVERSE_TYPES.includes(part.type)
					? type === 'integer'
						? parts.reduce((acc, p) => (p.type === 'integer' ? acc + p.value.length : acc), 0)
						: parts.filter((p) => p.type === type).length
					: 0

			// Split up integers and fractions
			if (type === 'integer' || type === 'fraction')
				return part.value.split('').map((char) => ({
					type,
					value: parseInt(char),
					key: `${type}:${REVERSE_TYPES.includes(part.type) ? counts[type]-- : counts[type]++}`
				}))

			return {
				type,
				value: part.value,
				key: `${type}:${REVERSE_TYPES.includes(part.type) ? counts[type]-- : counts[type]++}`
			}
		})
	}, [children, locales, format])
	// Abort if invalid
	if (!parts) return children

	const id = React.useId()

	return (
		<span>
			<AnimatePresence mode="popLayout" initial={false}>
				{parts.map(({ type, value, key: _key }) => {
					const key = `${id}${_key}`
					return type === 'integer' || type === 'fraction' ? (
						<MotionRoll
							key={key}
							layoutId={key}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{value}
						</MotionRoll>
					) : (
						<motion.span
							// Make sure we re-render if the value changes, to trigger the exit animation:
							key={`${key}:${value}`}
							style={{ display: 'inline-block' }}
							layoutId={key}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{value}
						</motion.span>
					)
				})}
			</AnimatePresence>
		</span>
	)
}

const Roll = React.forwardRef<HTMLSpanElement, { children: number }>(({ children: value }, ref) => {
	const above = []
	for (let i = 9; i > value; i--) {
		above.push(<span key={i}>{i}</span>)
	}
	const below = []
	for (let i = value - 1; i >= 0; i--) {
		below.push(<span key={i}>{i}</span>)
	}
	return (
		<span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
			{above.length > 0 && (
				<span
					aria-hidden="true"
					style={{
						position: 'absolute',
						bottom: '100%',
						left: 0,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						userSelect: 'none'
					}}
				>
					{above}
				</span>
			)}
			{value}
			{below.length > 0 && (
				<span
					aria-hidden="true"
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						userSelect: 'none'
					}}
				>
					{below}
				</span>
			)}
		</span>
	)
})

const MotionRoll = motion(Roll)
