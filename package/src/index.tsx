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
type KeyedPart = { key: string }
type NumberPart = DigitPart | SymbolPart
type KeyedNumberPart = NumberPart & { key: string }
type KeyedSymbolPart = SymbolPart & KeyedPart

const isDigitPart = (part: NumberPart): part is DigitPart =>
	part.type === 'integer' || part.type === 'fraction'

function usePrevious<T>(value: T, initial: T): T {
	const ref = React.useRef(initial)
	React.useEffect(() => {
		ref.current = value
	}, [value])
	return ref.current
}

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

function useRefs<T>(length: number, initial: T | null = null) {
	const ref = React.useRef<Array<typeof initial>>(new Array(length).fill(initial))
	React.useEffect(() => {
		ref.current = ref.current.slice(0, length)
	}, [length])
	return ref.current
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
	// Key the integer parts backwards, mostly for better layout animations
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
>(({ children, justify, ...rest }, _ref) => {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const innerRef = React.useRef<HTMLSpanElement>(null)

	const { mounted } = React.useContext(NumberRollContext)

	const [width, setWidth] = React.useState<number>()
	React.useEffect(() => {
		if (!innerRef.current) return

		const observer = new ResizeObserver(([entry]) => {
			setWidth(entry?.contentRect.width)
		})

		observer.observe(innerRef.current)
		return () => observer.disconnect()
	}, [])

	// Keep track of which parts were just removed, so they can animate out but can still be
	// reclaimed if the animation is interrupted:
	const prevChildren = usePrevious(children, [])
	const removed = useMemoWithPrevious(
		(r) => [
			// Mark any that were removed
			...prevChildren.filter((p) => !children.find((part) => part.key === p.key)),
			// Re-add any that had been marked for removal
			...r.filter((p) => !children.find((part) => part.key === p.key))
		],
		[children, prevChildren],
		[] as KeyedNumberPart[]
	)
	const numRemoved = removed.length
	const isRemoved = (i: number) => i < numRemoved

	React.useEffect(() => {
		console.log(removed, children)
	}, [children])

	const parts = React.useMemo(() => removed.concat(children), [removed, children])
	const partRefs = useRefs<HTMLSpanElement>(parts.length)

	// Manually move the removed parts to the beginning of the section (outside the measured area),
	// so they're still managed by React but don't affect the layout measurements:
	React.useLayoutEffect(() => {
		parts.forEach((part, i) => {
			if (isRemoved(i)) {
				ref.current?.insertBefore(partRefs[i]!, innerRef.current)
			}
			// TODO: re-add/move all children into measured area
		})
	}, [parts])

	return (
		<motion.span
			{...rest}
			layoutRoot
			ref={ref}
			style={{ display: 'inline-flex', justifyContent: justify, width }}
		>
			<span style={{ display: 'inline-flex', justifyContent: justify }} ref={innerRef}>
				{parts.map((part, i) =>
					isDigitPart(part) ? (
						<Roll
							ref={(r) => void (partRefs[i] = r)}
							key={part.key}
							layoutId={part.key}
							transition={{ duration: 0.3 }}
							defaultValue={mounted ? 0 : part.value}
							initial={mounted ? { opacity: 0 } : {}}
							animate={{ opacity: 1 }}
							value={isRemoved(i) ? 0 : part.value}
						/>
					) : (
						<Symbol ref={(r) => void (partRefs[i] = r)} partKey={part.key}>
							{part.value}
						</Symbol>
					)
				)}
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

type Rename<T, K extends keyof T, N extends string> = Pick<T, Exclude<keyof T, K>> & {
	[P in N]: T[K]
}

const Symbol = React.forwardRef<
	HTMLSpanElement,
	Omit<Rename<Rename<KeyedSymbolPart, 'key', 'partKey'>, 'value', 'children'>, 'type'>
>(({ partKey: key, children: value }, ref) => {
	return (
		<motion.span
			ref={ref}
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
			transition={{ duration: 3 }}
		>
			{value}
		</motion.span>
	)
})
