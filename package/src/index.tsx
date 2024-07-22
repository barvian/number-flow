import * as React from 'react'
import {
	AnimatePresence,
	LayoutGroup,
	motion,
	addScaleCorrector,
	transform,
	type HTMLMotionProps,
	useMotionValue,
	usePresence,
	useIsPresent
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
	const ref = React.useRef<HTMLSpanElement>(null)

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
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => setMounted(true), [])

	return (
		<span ref={ref} style={{ display: 'inline-block', position: 'relative' }}>
			{/* Position this absolutely so that the mask-image doesn't cut off the edges: */}
			<motion.span
				style={{
					display: 'block',
					margin: '0 calc(-1*var(--mask-width,0.5em))',
					padding: '0 var(--mask-width,0.5em)',
					maskImage:
						'linear-gradient(to bottom, transparent 0, #000 calc((100% - 1em) / 2), #000 calc(100% - (100% - 1em) / 2), transparent 100%)',
					whiteSpace: 'nowrap'
				}}
			>
				<LayoutGroup id={id}>
					<Section layout style={{ justifyContent: 'end' }}>
						<AnimatePresence initial={false} mode="popLayout">
							{parts.map(({ type, value, key }) =>
								type === 'integer' || type === 'fraction' ? (
									<Roll
										key={key}
										transition={{ duration: 0.3 }}
										defaultValue={mounted ? 0 : value}
										initial={mounted ? { opacity: 0 } : {}}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										value={value}
									/>
								) : (
									<motion.span
										// Make sure we re-render if the value changes, to trigger the exit animation:
										key={`${key}:${value}`}
										style={{
											display: 'inline-block',
											whiteSpace: 'pre' /* some symbols are just spaces */
										}}
										layoutId={key}
										layout="position"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 3 }}
									>
										{value}
									</motion.span>
								)
							)}
						</AnimatePresence>
					</Section>
				</LayoutGroup>
			</motion.span>
			<span style={{ position: 'relative', color: 'transparent !important' }}>
				{parts.map(({ value }, i) => (
					<span key={i} style={{ whiteSpace: 'pre' }}>
						{value}
					</span>
				))}
			</span>
		</span>
	)
}

const Section = React.forwardRef<
	HTMLSpanElement,
	HTMLMotionProps<'span'> & { children: React.ReactNode }
>(({ children, style, ...rest }, ref) => {
	const innerRef = React.useRef<HTMLSpanElement>(null)

	const [width, setWidth] = React.useState<number>()
	React.useEffect(() => {
		if (!innerRef.current) return

		// Use a ResizeObserver to listen for changes to the font size
		const observer = new ResizeObserver(([entry]) => {
			setWidth(entry?.contentRect.width)
		})

		observer.observe(innerRef.current)
		return () => observer.disconnect()
	}, [])

	return (
		<motion.span {...rest} ref={ref} style={{ ...style, display: 'inline-flex', width }}>
			<span ref={innerRef}>{children}</span>
		</motion.span>
	)
})

const valueToY = transform([0, 9], [-90, 0])

function useFirst<T>(value?: T) {
	const ref = React.useRef<T | undefined>(undefined)
	if (value !== undefined && ref.current === undefined) ref.current = value
	return ref.current
}

const Roll = React.forwardRef<
	HTMLSpanElement,
	HTMLMotionProps<'span'> & { value: number; defaultValue?: number }
>(({ value: _value, defaultValue: _default = _value, ...rest }, ref) => {
	const innerRef = React.useRef<HTMLSpanElement>(null)
	const numberRefs = React.useRef(
		Array(10)
			.fill(null)
			.map(() => React.createRef<HTMLSpanElement>())
	)

	const defaultValue = useFirst(_default)!
	const present = useIsPresent()
	const value = present ? _value : 0

	const renderDigit = (i: number) => (
		<span
			key={i}
			aria-hidden={i === value}
			style={{ userSelect: 'none' }}
			ref={numberRefs.current[i]}
		>
			{i}
		</span>
	)

	const above = []
	for (let i = 9; i > defaultValue; i--) {
		above.push(renderDigit(i))
	}
	const below = []
	for (let i = defaultValue - 1; i >= 0; i--) {
		below.push(renderDigit(i))
	}

	const [width, setWidth] = React.useState<`${number}em`>()
	React.useEffect(() => {
		const { width, fontSize } = getComputedStyle(numberRefs.current[value]!.current!)
		setWidth(`${parseFloat(width) / parseFloat(fontSize)}em`)
	}, [value])

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout
			transition={{ duration: 3 }}
			style={{ display: 'inline-flex', justifyContent: 'center', width }}
		>
			{/* Scale correction: */}
			<motion.span
				layout
				transition={{ duration: 3 }}
				style={{ display: 'inline-flex', justifyContent: 'center' }}
			>
				{/* This needs to be separate so the layout animation doesn't affect its y: */}
				<motion.span
					ref={innerRef}
					style={{
						display: 'inline-flex',
						flexDirection: 'column',
						alignItems: 'center',
						position: 'relative'
					}}
					initial={{ y: '0%' }}
					animate={{ y: `${(value - defaultValue) * 100}%` }}
					transition={{ duration: 3 }}
				>
					<span
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							position: 'absolute',
							bottom: '100%',
							left: 0,
							width: '100%'
						}}
					>
						{above}
					</span>
					{renderDigit(defaultValue)}
					<span
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							position: 'absolute',
							top: '100%',
							left: 0,
							width: '100%'
						}}
					>
						{below}
					</span>
				</motion.span>
			</motion.span>
		</motion.span>
	)
})
