import * as React from 'react'
import {
	AnimatePresence,
	LayoutGroup,
	motion,
	transform,
	type HTMLMotionProps
} from 'framer-motion'

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
				<LayoutGroup>
					{parts.map(({ type, value, key: _key }) => {
						const key = `${id}${_key}`
						return type === 'integer' || type === 'fraction' ? (
							<Roll
								key={key}
								layoutId={key}
								layout="position"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							>
								{value}
							</Roll>
						) : (
							<motion.span
								// Make sure we re-render if the value changes, to trigger the exit animation:
								key={`${key}:${value}`}
								style={{ display: 'inline-block' }}
								layoutId={key}
								layout="position"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							>
								{value}
							</motion.span>
						)
					})}
				</LayoutGroup>
			</AnimatePresence>
		</span>
	)
}

const valueToY = transform([0, 9], [-90, 0])

// Don't export
const Roll = React.forwardRef<HTMLSpanElement, HTMLMotionProps<'span'> & { children: number }>(
	({ children: value, ...rest }, _ref) => {
		const ref = React.useRef<HTMLSpanElement>(null)
		const innerRef = React.useRef<HTMLSpanElement>(null)
		React.useImperativeHandle(_ref, () => ref.current!, [])

		const numberRefs = React.useRef(
			Array(10)
				.fill(null)
				.map(() => React.createRef<HTMLSpanElement>())
		)

		const above = []
		for (let i = 9; i > value; i--) {
			above.push(
				<span key={i} ref={numberRefs.current[i]} aria-hidden="true" style={{ userSelect: 'none' }}>
					{i}
				</span>
			)
		}
		const below = []
		for (let i = value - 1; i >= 0; i--) {
			below.push(
				<span key={i} ref={numberRefs.current[i]} aria-hidden="true" style={{ userSelect: 'none' }}>
					{i}
				</span>
			)
		}

		const [width, setWidth] = React.useState('auto')

		React.useEffect(() => {
			// TODO: this doesn't need to re-run every time:
			const { fontSize: _fontSize } = window.getComputedStyle(innerRef.current!)
			const fontSize = parseFloat(_fontSize)

			const currentNumberWidth = numberRefs.current[value]!.current!.getBoundingClientRect().width
			setWidth(`${currentNumberWidth / fontSize}em`)
		}, [value])

		return (
			<motion.span
				{...rest}
				ref={ref}
				style={{ display: 'inline-flex', justifyContent: 'center', width }}
			>
				<motion.span
					ref={innerRef}
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center'
					}}
					animate={{
						y: `${valueToY(value)}%`
					}}
				>
					{above}
					<span ref={numberRefs.current[value]}>{value}</span>
					{below}
				</motion.span>
			</motion.span>
		)
	}
)

function useLazyRef<T>(fn: () => T) {
	const ref = React.useRef<T>()

	if (ref.current === undefined) {
		ref.current = fn()
	}

	return ref as React.MutableRefObject<T>
}
