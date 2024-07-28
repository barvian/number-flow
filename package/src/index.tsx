import * as React from 'react'
import {
	AnimatePresence,
	LayoutGroup,
	motion,
	addScaleCorrector,
	type HTMLMotionProps,
	useIsPresent,
	MotionConfig
} from 'framer-motion'

addScaleCorrector({
	'--motion-number-scale-x-correct': {
		correct: (_, { treeScale, projectionDelta }) => projectionDelta!.x.scale * treeScale!.x
	}
})

// Merge the plus and minus sign types
type NumberPartType = Exclude<Intl.NumberFormatPartTypes, 'minusSign' | 'plusSign'> | 'sign'
type DigitPart = { type: NumberPartType & ('integer' | 'fraction'); value: number }
type SymbolPart = {
	type: Exclude<NumberPartType, 'integer' | 'fraction'>
	value: string
}
type NumberPart = DigitPart | SymbolPart
type KeyedPart = { key: string }
type KeyedDigitPart = DigitPart & KeyedPart
type KeyedSymbolPart = SymbolPart & KeyedPart
type KeyedNumberPart = KeyedDigitPart | KeyedSymbolPart

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
	{ locales, format }: { locales?: Intl.LocalesArgument; format?: Intl.NumberFormatOptions }
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
			case 'group':
				_integer.push({ type, value: part.value })
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
	value,
	locales,
	format
}: {
	value: number | bigint | string
	locales?: Intl.LocalesArgument
	format?: Intl.NumberFormatOptions
}) {
	const ref = React.useRef<HTMLSpanElement>(null)
	const maskedXRef = React.useRef<HTMLSpanElement>(null)

	// Split the number into parts
	const parts = React.useMemo(
		() => formatToParts(value, { locales, format }),
		[value, locales, format]
	)
	// Abort if invalid
	if (!parts) return value
	const { pre, integer, fraction, post, exponentSymbol, exponent } = parts

	const id = React.useId()

	// Gross hack to apply the scale correction on a custom property:
	// https://github.com/framer/motion/blob/fe6e3cb2c1d768fafe6adb7715386b57a87f0437/packages/framer-motion/src/render/html/utils/render.ts#L14
	const appliedScaleSetter = React.useRef(false)
	React.useEffect(() => {
		if (appliedScaleSetter.current || !maskedXRef.current?.style) return
		Object.defineProperty(maskedXRef.current.style, '--motion-number-scale-x-correct', {
			set(v) {
				return this.setProperty('--motion-number-scale-x-correction', v)
			}
		})
		appliedScaleSetter.current = true
	}, [])

	// Build the mask
	// https://expensive.toys/blog/blur-vignette
	const maskHeight = 'min(var(--mask-size,0.5em), (100% - 1em) / 2)'
	const maskWidth = 'calc(var(--mask-size,0.5em) / var(--motion-number-scale-x-correction, 1))'
	const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}
	const mask =
		// Horizontal:
		`linear-gradient(to right, transparent 0, #000 ${maskWidth}, #000 calc(100% - ${maskWidth}), transparent),` +
		// Vertical:
		`linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%),` +
		// TL corner
		`radial-gradient(at bottom right, ${cornerGradient}),` +
		// TR corner
		`radial-gradient(at bottom left, ${cornerGradient}), ` +
		// BR corner
		`radial-gradient(at top left, ${cornerGradient}), ` +
		// BL corner
		`radial-gradient(at top right, ${cornerGradient})`
	const maskSize =
		`100% calc(100% - ${maskHeight} * 2),` +
		`calc(100% - ${maskWidth} * 2) 100%,` +
		`${maskWidth} ${maskHeight},` +
		`${maskWidth} ${maskHeight},` +
		`${maskWidth} ${maskHeight},` +
		`${maskWidth} ${maskHeight}`

	return (
		<MotionConfig transition={{ type: 'spring', duration: 3, bounce: 0 }}>
			<LayoutGroup id={id}>
				<motion.span
					layout
					ref={maskedXRef}
					style={{
						display: 'inline-block',
						// Activates the scale correction, which gets stored in --motion-number-scale-x-correction
						'--motion-number-scale-x-correct': 1,
						margin: '0 calc(-1*var(--mask-width,0.5em))',
						padding: '0 var(--mask-width,0.5em)',
						WebkitMaskImage: mask,
						WebkitMaskSize: maskSize,
						WebkitMaskPosition: 'center, center, top left, top right, bottom right, bottom left',
						WebkitMaskRepeat: 'no-repeat',
						whiteSpace: 'nowrap'
					}}
				>
					<Section justify="end">{integer}</Section>
					<Section>{fraction}</Section>
				</motion.span>
				{/* <span style={{ position: 'relative', color: 'transparent !important' }}>
					{parts.map(({ value }, i) => (
						<span key={i} style={{ whiteSpace: 'pre' }}>
						{value}
						</span>
					))}
				</span> */}
			</LayoutGroup>
		</MotionConfig>
	)
}

const Section = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> & {
		children: KeyedNumberPart[]
		justify?: 'start' | 'end'
	}
>(({ children, justify = 'start', ...rest }, _ref) => {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const innerRef = React.useRef<HTMLSpanElement>(null)

	const mounted = useMounted()

	const exitingWidths = React.useRef(new Map<KeyedDigitPart['key'], number>()).current

	const [width, setWidth] = React.useState<number>()
	const onResize = () => {
		// NOTE: this should apply on first render, so that initial adds don't affect the layout
		if (!innerRef.current) return
		const exitingWidth = Array.from(exitingWidths.values()).reduce((all, w) => all + w, 0)
		console.log(getWidthInEm(innerRef.current) - exitingWidth)
		setWidth(getWidthInEm(innerRef.current) - exitingWidth)
	}
	React.useEffect(() => {
		onResize()
	}, [children])

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout
			style={{
				display: 'inline-flex',
				lineHeight: 'var(--digit-line-height, 1.15)',
				width: width == null ? 'auto' : `${Math.max(width, 0.01)}em` // Framer doesn't seem to like animating to/from 0
			}}
		>
			<SectionMeasured
				style={{
					display: 'inline-flex',
					justifyContent: 'inherit'
				}}
				ref={innerRef}
			>
				&#8203;{/* Zero-width space to prevent height transitions */}
				<AnimatePresence onExitComplete={() => exitingWidths.clear()} initial={false}>
					{children.map((part, i) =>
						isDigitPart(part) ? (
							<SectionRoll
								// ref={(r) => void (partRefs[i] = r)}
								key={part.key}
								layoutId={part.key}
								initialValue={mounted ? 0 : part.value}
								initial={mounted ? { opacity: 0 } : {}}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								value={part.value}
								onResize={(w, isPresent) => {
									if (isPresent) exitingWidths.delete(part.key)
									else exitingWidths.set(part.key, w)
									onResize()
								}}
							/>
						) : (
							<SectionSymbol
								key={part.key}
								type={part.type}
								partKey={part.key}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onPresenceChange={(isPresent, w) => {
									if (isPresent) exitingWidths.delete(part.key)
									else exitingWidths.set(part.key, w)
									onResize()
								}}
							>
								{part.value}
							</SectionSymbol>
						)
					)}
				</AnimatePresence>
			</SectionMeasured>
		</motion.span>
	)
})

const SectionMeasured = React.forwardRef<
	HTMLSpanElement,
	{ justify?: 'start' | 'end' } & React.HTMLAttributes<'span'>
>(({ children, justify = 'start', ...rest }, ref) =>
	justify === 'end' ? (
		<span
			ref={ref}
			style={{
				display: 'inline-flex',
				justifyContent: 'inherit'
			}}
		>
			{children}
		</span>
	) : (
		<motion.span
			ref={ref}
			layout
			style={{
				display: 'inline-flex',
				justifyContent: 'inherit'
			}}
		>
			{children}
		</motion.span>
	)
)

const SectionRoll = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'onResize'> & {
		value: number
		initialValue?: number
		onResize?: (widthInEm: number, isPresent: boolean) => void
	}
>(({ value: _value, initialValue: _initialValue = _value, onResize, ...rest }, ref) => {
	const initialValue = React.useRef(_initialValue).current // Non-reactive

	const mounted = useMounted()
	const innerRef = React.useRef<HTMLSpanElement>(null)
	const numberRefs = useRefs<HTMLSpanElement>(10)

	// Don't use a normal exit animation for this because we want it to trigger the width effect:
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
	// Set the width to the width of the current value:
	const sizeToValue = () => {
		if (!numberRefs[value]) return
		const w = getWidthInEm(numberRefs[value])
		setWidth(w)
	}
	React.useEffect(() => {
		// Skip setting the width if this is the first render and it's not going to animate:
		if (!mounted && initialValue === value) return
		sizeToValue()
	}, [value])
	React.useEffect(() => {
		// <Section> needs a width if we're exiting, so set one if we haven't already:
		if (!isPresent && width == null) sizeToValue()
	}, [isPresent, width])

	// Wait until any width changes have been committed before emitting:
	React.useEffect(() => {
		if (width == null) return
		console.log('resize', value, isPresent, width)
		onResize?.(width, isPresent)
	}, [width, isPresent])

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout
			style={{
				display: 'inline-flex',
				justifyContent: 'center',
				width: width == null ? 'auto' : `${width}em`
			}}
		>
			{/* Scale correction, needed because the children are center-aligned within the parent: */}
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

const SectionSymbol = React.forwardRef<
	HTMLSpanElement,
	HTMLMotionProps<'span'> & {
		onPresenceChange: (isPresent: boolean, width: number) => void
	} & Rename<Rename<KeyedSymbolPart, 'key', 'partKey'>, 'value', 'children'>
>(({ partKey: key, type, children: value, onPresenceChange, ...rest }, _ref) => {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])

	const isPresent = useIsPresent()

	React.useEffect(() => {
		if (!isPresent && ref.current) onPresenceChange?.(isPresent, getWidthInEm(ref.current))
	}, [isPresent])

	return (
		<motion.span
			{...rest}
			ref={ref}
			// Make sure we re-render if the value changes, to trigger the exit animation:
			key={`${key}:${value}`}
			{...{ [`data-motion-number-${type}`]: value }}
			style={{
				display: 'inline-block',
				whiteSpace: 'pre' /* some symbols are just spaces */
			}}
			layoutId={key}
			layout
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
		>
			{value}
		</motion.span>
	)
})

const renderSymbol = ({ key, value }: KeyedNumberPart) => (
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
	>
		{value}
	</motion.span>
)
