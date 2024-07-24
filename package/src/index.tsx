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
type DigitPart = { type: NumberPartType & ('integer' | 'fraction'); value: number }
type SymbolPart = {
	type: Exclude<NumberPartType, 'integer' | 'fraction'>
	value: string
}
type NumberPart = DigitPart | SymbolPart
type KeyedNumberPart = NumberPart & { key: string }

function useMemoWithPrevious<T>(
	factory: (previous: T) => T,
	deps: React.DependencyList,
	initial: T
): T {
	const prev = React.useRef<T>(initial)
	const value = React.useMemo(() => factory(prev.current), [...deps])
	React.useEffect(() => {
		prev.current = value
	}, [value])
	return value
}

const formatToParts = (
	value: number | bigint | string,
	locales?: Intl.LocalesArgument,
	format?: Intl.NumberFormatOptions
) => {
	const formatter = new Intl.NumberFormat(locales, format)
	const parts = formatter.formatToParts(value)

	const pre: KeyedNumberPart[] = []
	const _integer: NumberPart[] = [] // we go back to add the keys in reverse
	const fraction: KeyedNumberPart[] = []
	const post: KeyedNumberPart[] = []
	let exponentSymbol: string | undefined
	let exponent = ''

	const counts: Partial<Record<NumberPartType, number>> = {}
	const generateKey = (type: NumberPartType) => {
		if (!counts[type]) counts[type] = 0
		return `${type}:${counts[type]++}`
	}

	let seenInteger = false,
		seenDecimal = false
	for (const part of parts) {
		// Merge plus and minus sign types (doing it this way appeases TypeScript)
		const type: NumberPartType =
			part.type === 'minusSign' || part.type === 'plusSign' ? 'sign' : part.type

		switch (type) {
			case 'nan':
			case 'infinity':
				return null
			case 'integer':
				seenInteger = true
				_integer.push(...part.value.split('').map((d) => ({ type, value: parseInt(d) })))
				break
			case 'decimal':
				seenDecimal = true
				fraction.push({ type, value: part.value, key: generateKey(type) })
				break
			case 'fraction':
				fraction.push(
					...part.value.split('').map((d) => ({ type, value: parseInt(d), key: generateKey(type) }))
				)
				break
			case 'exponentSeparator':
				exponentSymbol = part.value
				break
			// Add these as strings because they'll get parsed as numbers later:
			case 'exponentMinusSign':
			case 'exponentInteger':
				exponent += part.value
				break
			default:
				;(seenInteger || seenDecimal ? post : pre).push({
					type,
					value: part.value,
					key: generateKey(type)
				})
		}
	}

	const integer: KeyedNumberPart[] = []
	// Key the integer parts backwards, for better layout animations
	for (let i = _integer.length - 1; i >= 0; i--) {
		integer.unshift({ ..._integer[i]!, key: generateKey(_integer[i]!.type) })
	}

	return {
		pre,
		integer,
		fraction,
		post,
		exponentSymbol,
		exponent
	}
}

const NumberRollContext = React.createContext({
	mounted: false
})

export default function NumberRoll({
	children,
	locales,
	format
}: {
	children: number | bigint | string
	locales?: Intl.LocalesArgument
	format?: Intl.NumberFormatOptions
}) {
	const ref = React.useRef<HTMLSpanElement>(null)

	// Split the number into parts
	const parts = React.useMemo(
		() => formatToParts(children, locales, format),
		[children, locales, format]
	)
	// Abort if invalid
	if (!parts) return children
	const { pre, integer, fraction, post, exponentSymbol, exponent } = parts

	const id = React.useId()

	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => setMounted(true), [])

	return (
		<NumberRollContext.Provider value={{ mounted }}>
			<motion.span ref={ref} style={{ display: 'inline-block', position: 'relative' }}>
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
						<Section layout justify="end">
							{integer}
						</Section>
					</LayoutGroup>
				</motion.span>
				{/* <span style={{ position: 'relative', color: 'transparent !important' }}>
					{parts.map(({ value }, i) => (
						<span key={i} style={{ whiteSpace: 'pre' }}>
							{value}
						</span>
					))}
				</span> */}
			</motion.span>
		</NumberRollContext.Provider>
	)
}

const Section = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> & {
		children: KeyedNumberPart[]
		justify: 'start' | 'end'
	}
>(({ children, justify, ...rest }, ref) => {
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

	// Keep track of which parts were just removed, so they can animate out but can still be
	// reclaimed if the animation is interrupted:
	const prevChildren = React.useRef<KeyedNumberPart[]>()
	const removed = useMemoWithPrevious(
		(r) => {
			const prev = prevChildren.current
			prevChildren.current = children
			return !prev
				? r
				: [
						// Add any new ones that were removed
						...prev.filter((p) => !children.find((part) => part.key === p.key)),
						// Re-add any that had been marked for removal
						...r.filter((p) => !children.find((part) => part.key === p.key))
					]
		},
		[children],
		[] as KeyedNumberPart[]
	)

	React.useEffect(() => {
		console.log(removed, children)
	}, [removed, children])

	return (
		<motion.span
			{...rest}
			layoutRoot
			ref={ref}
			style={{ display: 'inline-flex', justifyContent: justify, width }}
		>
			{/* {removed.map((part) => (
				<Part
					{...part}
					partKey={part.key}
					onAnimationComplete={() => setRemoved((r) => r.filter((p) => p.key !== part.key))}
				/>
			))} */}
			<span style={{ display: 'inline-flex', justifyContent: justify }} ref={innerRef}>
				{removed.concat(children).map((part) => (
					<Part {...part} partKey={part.key} />
				))}
			</span>
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

function Part({
	animate,
	type,
	partKey,
	value,
	...rest
}: Omit<HTMLMotionProps<'span'>, 'children'> & NumberPart & { partKey: KeyedNumberPart['key'] }) {
	const { mounted } = React.useContext(NumberRollContext)

	return type === 'integer' || type === 'fraction' ? (
		<Roll
			{...rest}
			layoutId={partKey}
			transition={{ duration: 0.3 }}
			defaultValue={mounted ? 0 : value}
			initial={mounted ? { opacity: 0 } : {}}
			animate={animate || { opacity: 1 }}
			value={value}
		/>
	) : (
		<motion.span
			{...rest}
			// Make sure we re-render if the value changes, to trigger the exit animation:
			key={`${partKey}:${value}`}
			style={{
				display: 'inline-block',
				whiteSpace: 'pre' /* some symbols are just spaces */
			}}
			layoutId={partKey}
			layout="position"
			initial={{ opacity: 0 }}
			animate={animate || { opacity: 1 }}
			transition={{ duration: 3 }}
		>
			{value}
		</motion.span>
	)
}
