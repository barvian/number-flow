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
	useIsPresent,
	frame,
	MotionConfig
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

function getWidthInEm(element: HTMLElement) {
	const { width, fontSize } = getComputedStyle(element)
	return parseFloat(width) / parseFloat(fontSize)
}

function useMounted() {
	const mounted = React.useRef(false)
	React.useEffect(() => {
		mounted.current = true
	}, [])
	return mounted.current
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
	const mounted = useMounted()

	// Split the number into parts
	const parts = React.useMemo(
		() => formatToParts(children, locales, format),
		[children, locales, format]
	)
	// Abort if invalid
	if (!parts) return children
	const { pre, integer, fraction, post, exponentSymbol, exponent } = parts

	const id = React.useId()

	return (
		<MotionConfig transition={{ duration: 3 }}>
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
						<Section justify="end">{integer}</Section>
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
		</MotionConfig>
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

	const mounted = useMounted()

	const [width, setWidth] = React.useState<number>()
	const onResize = () => {
		// NOTE: this should apply on first render, so that initial adds don't affect the layout
		if (!innerRef.current) return
		setWidth(getWidthInEm(innerRef.current))
	}
	React.useEffect(() => {
		onResize()
	}, [children])

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout="position"
			layoutRoot
			style={{ display: 'inline-flex', justifyContent: justify, width: width && `${width}em` }}
		>
			<motion.span
				style={{
					display: 'inline-flex',
					justifyContent: justify
				}}
				ref={innerRef}
				data-number-roll-inner
			>
				<AnimatePresence>
					{children.map((part, i) =>
						isDigitPart(part) ? (
							<Roll
								// ref={(r) => void (partRefs[i] = r)}
								key={part.key}
								layoutId={part.key}
								initialValue={mounted ? 0 : part.value}
								initial={mounted ? { opacity: 0 } : {}}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								value={part.value}
								onResize={onResize}
							/>
						) : (
							<Symbol partKey={part.key}>{part.value}</Symbol>
						)
					)}
				</AnimatePresence>
			</motion.span>
		</motion.span>
	)
})

const Roll = React.forwardRef<
	HTMLSpanElement,
	HTMLMotionProps<'span'> & {
		value: number
		initialValue?: number
		onResize?: (widthInEm: number) => void
	}
>(({ value: _value, initialValue: _initialValue = _value, onResize, ...rest }, ref) => {
	const initialValue = React.useRef(_initialValue).current // Non-reactive

	const mounted = useMounted()
	const innerRef = React.useRef<HTMLSpanElement>(null)
	const numberRefs = useRefs<HTMLSpanElement>(10)

	// We can't use a normal exit animation for this because we want it to trigger the width effect:
	const isPresent = useIsPresent()
	const value = isPresent ? _value : 0

	const renderDigit = (i: number) => (
		<span
			key={i}
			aria-hidden={i === value}
			style={{ userSelect: 'none' }}
			ref={(r) => void (numberRefs[i] = r)}
		>
			{i}
		</span>
	)

	const above = []
	for (let i = 9; i > initialValue; i--) {
		above.push(renderDigit(i))
	}
	const below = []
	for (let i = initialValue - 1; i >= 0; i--) {
		below.push(renderDigit(i))
	}

	const [width, setWidth] = React.useState<number>()
	React.useEffect(() => {
		// Skip setting the width if this is the first render and it's not going to animate
		if (!numberRefs[value] || (!mounted && initialValue === value)) return
		setWidth(getWidthInEm(numberRefs[value]))
	}, [value])

	React.useEffect(() => {
		if (width != null) onResize?.(width)
	}, [width])

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout
			style={{ display: 'inline-flex', justifyContent: 'center', width: width && `${width}em` }}
		>
			{/* Scale correction: */}
			<motion.span layout style={{ display: 'inline-flex', justifyContent: 'center' }}>
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
					animate={{ y: `${(value - initialValue) * 100}%` }}
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
					{renderDigit(initialValue)}
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
		>
			{value}
		</motion.span>
	)
})
