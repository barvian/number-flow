import * as React from 'react'
import {
	motion,
	addScaleCorrector,
	type HTMLMotionProps,
	MotionConfig,
	easeOut,
	type AnimatePresenceProps,
	MotionConfigContext,
	useIsPresent,
	type MotionConfigProps
} from 'framer-motion'
import JustifiedAnimatePresence from './JustifiedAnimatePresence'

addScaleCorrector({
	'--motion-number-scale-x-correct': {
		correct: (_, { treeScale, projectionDelta }) => projectionDelta!.x.scale * treeScale!.x
	}
})

// Merge the plus and minus sign types
type NumberPartType = Exclude<Intl.NumberFormatPartTypes, 'minusSign' | 'plusSign'> | 'sign'
// These need to be separated for the discriminated union to work:
// https://www.typescriptlang.org/play/?target=99&ssl=8&ssc=1&pln=9&pc=1#code/C4TwDgpgBAIglgczsKBeKBvKpIC4oDkcAdsBAhAE4FQA+hAZpQIYDGwcA9sQQNxQA3ZgBsArhHzFRAWwBGVKAF8AsACgc0AMIALZpTSZs4CYVa7q-QSPH4AzsEokEStWoaji7LsSgATTgDKwKIMDAAUYHrA+PBIKPQ6egCUmGpQUHAMUBFRAHQaaKjoRKTkVDS09JGUwPnGhcVMbBzcBCkYaelQ1cCdilAQwrbQHapd3VFQAPRTUAA8ALTY2nC2GbY8KImUADRQwnAA1tAAkgS+AwAekOzZAPxJfWqKQA
type IntegerPart = { type: NumberPartType & 'integer'; value: number }
type FractionPart = { type: NumberPartType & 'fraction'; value: number }
type DigitPart = IntegerPart | FractionPart
type SymbolPart = {
	type: Exclude<NumberPartType, 'integer' | 'fraction'>
	value: string
}
type NumberPart = DigitPart | SymbolPart

type KeyedPart = { key: string }
type KeyedDigitPart = DigitPart & KeyedPart
type KeyedSymbolPart = SymbolPart & KeyedPart
type KeyedNumberPart = KeyedDigitPart | KeyedSymbolPart

function getWidthInEm(element: HTMLElement) {
	const { width, fontSize } = getComputedStyle(element)
	return parseFloat(width) / parseFloat(fontSize)
}

function useIsInitialRender() {
	const [initialRender, setInitialRender] = React.useState(true)
	React.useEffect(() => {
		setInitialRender(false)
	}, [])
	return initialRender
}

const formatToParts = (
	value: number | bigint | string,
	{ locales, format }: { locales?: Intl.LocalesArgument; format?: Intl.NumberFormatOptions }
) => {
	const formatter = new Intl.NumberFormat(locales, format)
	const parts = formatter.formatToParts(value)

	const pre: KeyedNumberPart[] = []
	const _integer: NumberPart[] = [] // we do a second pass to key these from RTL
	const fraction: KeyedNumberPart[] = []
	const post: KeyedNumberPart[] = []

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
			// case 'nan':
			// case 'infinity':
			// 	// TODO: handle these
			// 	break
			// case 'exponentSeparator':
			// 	break
			// case 'exponentMinusSign':
			// case 'exponentInteger':
			// 	break
			default:
				;(seenInteger || seenDecimal ? post : pre).push({
					type,
					value: part.value,
					key: generateKey(type)
				})
		}
	}

	const integer: KeyedNumberPart[] = []
	// Key the integer parts RTL, for better layout animations
	for (let i = _integer.length - 1; i >= 0; i--) {
		integer.unshift({ ..._integer[i]!, key: generateKey(_integer[i]!.type) })
	}

	return { pre, integer, fraction, post }
}

export const DEFAULT_TRANSITION: MotionConfigProps['transition'] = {
	duration: 0.5,
	ease: easeOut,
	layout: { type: 'spring', duration: 1, bounce: 0 },
	y: { type: 'spring', duration: 1, bounce: 0 }
}

// Build the mask for the numbers. Technique taken from:
// https://expensive.toys/blog/blur-vignette
const maskHeight = 'min(var(--mask-height,0.5em), (100% - 1em) / 2)'
const maskWidth = 'calc(var(--mask-width,0.5em) / var(--motion-number-scale-x-correction, 1))'
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

const RootContext = React.createContext({
	forceUpdate: () => {}
})

export type MotionNumberProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
	value: number | bigint | string
	locales?: Intl.LocalesArgument
	// Scientific and engineering notation are not supported atm:
	format?: Omit<Intl.NumberFormatOptions, 'notation'> & {
		notation?: Exclude<Intl.NumberFormatOptions['notation'], 'scientific' | 'engineering'>
	}
	transition?: React.ComponentProps<typeof MotionConfig>['transition']
}

const MotionNumber = React.forwardRef<HTMLSpanElement, MotionNumberProps>(function MotionNumber(
	{ value, locales, format, transition: _transition, style, ...rest },
	ref
) {
	// Split the number into parts
	const parts = React.useMemo(
		() => formatToParts(value, { locales, format }),
		[value /*, locales, format*/]
	)
	const { pre, integer, fraction, post } = parts

	const maskedRef = React.useRef<HTMLSpanElement>(null)

	// Gross hack to apply the scale correction on a custom property:
	// https://github.com/framer/motion/blob/fe6e3cb2c1d768fafe6adb7715386b57a87f0437/packages/framer-motion/src/render/html/utils/render.ts#L14
	const appliedScaleSetter = React.useRef(false)
	React.useEffect(() => {
		if (appliedScaleSetter.current || !maskedRef.current?.style) return
		Object.defineProperty(maskedRef.current.style, '--motion-number-scale-x-correct', {
			set(v) {
				return this.setProperty('--motion-number-scale-x-correction', v)
			}
		})
		appliedScaleSetter.current = true
	}, [])

	// Check if they've set MotionConfig already, and if so use that as the default transition instead:
	const { transition: motionConfigTransition } = React.useContext(MotionConfigContext)
	const transition = React.useMemo(
		() => ((_transition ?? motionConfigTransition) ? undefined : DEFAULT_TRANSITION),
		[motionConfigTransition, _transition]
	)

	// This is essentially what <LayoutGroup> does, except <LayoutGroup> gave worse performance:
	const [_updateCount, setUpdateCount] = React.useState(0)
	// These should be batched in React 18+:
	const forceUpdate = React.useCallback(() => {
		setUpdateCount(_updateCount + 1)
	}, [_updateCount])

	const context = React.useMemo(
		() => ({
			forceUpdate
		}),
		[forceUpdate]
	)

	return (
		<RootContext.Provider value={context}>
			<MotionConfig transition={transition}>
				<motion.span
					{...rest}
					layout // This is basically implied b/c of all the characters, and needed because Section doesn't use one
					style={{
						...style,
						direction: 'ltr', // I think this is needed b/c numbers are always LTR?
						display: 'inline-block',
						isolation: 'isolate', // so number can be underneath pre/post
						whiteSpace: 'nowrap'
					}}
				>
					<Section data-motion-number-part="pre" justify="right" mode="popLayout" parts={pre} />
					<motion.span
						layout // make sure this one scales
						ref={maskedRef}
						style={{
							display: 'inline-block',
							// Activates the scale correction, which gets stored in --motion-number-scale-x-correction
							'--motion-number-scale-x-correct': 1,
							margin: '0 calc(-1*var(--mask-width,0.5em))',
							padding: '0 var(--mask-width,0.5em)',
							position: 'relative', // for zIndex
							zIndex: -1, // should be underneath everything else
							overflow: 'clip', // important so it doesn't affect page layout
							// Prefixed properties have better support than unprefixed ones:
							WebkitMaskImage: mask,
							WebkitMaskSize: maskSize,
							WebkitMaskPosition: 'center, center, top left, top right, bottom right, bottom left',
							WebkitMaskRepeat: 'no-repeat'
						}}
					>
						<Section data-motion-number-part="integer" justify="right" parts={integer} />
						<Section data-motion-number-part="fraction" parts={fraction} />
					</motion.span>
					<Section data-motion-number-part="post" mode="popLayout" parts={post} />
				</motion.span>
			</MotionConfig>
		</RootContext.Provider>
	)
})

export default MotionNumber

export type Justify = 'left' | 'right'

const SectionContext = React.createContext({
	justify: 'left' as Justify
})

const Section = React.forwardRef<
	HTMLSpanElement,
	Omit<React.ReactHTML['span'], 'children'> & {
		parts: KeyedNumberPart[]
		justify?: Justify
		mode?: AnimatePresenceProps['mode']
	}
>(function Section({ parts, justify = 'left', mode, ...rest }, _ref) {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const { forceUpdate } = React.useContext(RootContext)

	const context = React.useMemo(() => ({ justify }), [justify])

	const measuredRef = React.useRef<HTMLSpanElement>(null)
	const isInitialRender = useIsInitialRender()

	// Keep a fixed width for the section, so that new characters get added to the end before the layout
	// animation starts, which makes them look like they were there already:
	const [width, setWidth] = React.useState<`${number}em`>()
	React.useEffect(() => {
		if (!measuredRef.current) return
		if (isInitialRender) {
			if (ref.current) ref.current.style.width = `${getWidthInEm(measuredRef.current)}em`
			return
		}

		// Find the new width by hiding exiting elements and measuring the measuredRef
		// This better handles i.e. negative margins between elements
		// We query the DOM because AnimatePresence overwrites ref props if the mode=popLayout.
		const exiting = measuredRef.current.querySelectorAll<HTMLSpanElement>('[data-exiting]')
		exiting.forEach((el) => {
			el.style.display = 'none'
			el.setAttribute('hidden', '') // mostly here as a style flag
		})
		const targetingWidths =
			measuredRef.current.querySelectorAll<HTMLSpanElement>('[data-target-width]')
		const prevWidths = new Array(targetingWidths.length)
		targetingWidths.forEach((el, i) => {
			prevWidths[i] = el.style.width
			el.style.width = el.dataset.targetWidth!
		})
		setWidth(`${getWidthInEm(measuredRef.current)}em`)
		forceUpdate()
		targetingWidths.forEach((el, i) => {
			el.style.width = prevWidths[i]
		})
		exiting.forEach((el) => {
			el.style.display = 'inline-flex'
			el.removeAttribute('hidden')
		})
	}, [parts.map((p) => p.value).join('')])

	return (
		<SectionContext.Provider value={context}>
			<span
				{...rest}
				ref={ref}
				style={{
					display: 'inline-flex',
					justifyContent: justify,
					lineHeight: 'var(--digit-line-height, 1.15)',
					width
				}}
			>
				<span
					ref={measuredRef}
					style={{
						display: 'inline-flex',
						justifyContent: 'inherit',
						position: 'relative' // needed for AnimatePresent popLayout
					}}
				>
					&#8203;{/* zero-width space to prevent the height from collapsing when no chars */}
					<JustifiedAnimatePresence mode={mode} justify={justify} initial={false}>
						{parts.map((part) =>
							part.type === 'integer' || part.type === 'fraction' ? (
								<Digit
									key={part.key}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									value={part.value}
									initialValue={isInitialRender ? undefined : 0}
								/>
							) : (
								<Sym
									key={part.type === 'literal' ? `${part.key}:${part.value}` : part.key}
									type={part.type}
									partKey={part.key}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									// unfortunately this is too buggy, probably b/c AnimatePresence wraps everything, but it'd simplify <Sym> a lot:
									// layoutId={part.type === 'literal' ? `${part.key}:${part.value}` : part.key}
								>
									{part.value}
								</Sym>
							)
						)}
					</JustifiedAnimatePresence>
				</span>
			</span>
		</SectionContext.Provider>
	)
})

const Digit = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> & {
		value: number
		initialValue?: number
	}
>(function Digit({ value: _value, initialValue: _initialValue = _value, ...rest }, _ref) {
	const initialValue = React.useRef(_initialValue).current // non-reactive, like React's defaultValue props
	const isInitialRender = useIsInitialRender()

	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])

	const measuredRef = React.useRef<HTMLSpanElement>(null)
	const numberRefs = React.useRef(new Array<HTMLSpanElement | null>(10))

	// Don't use a normal exit animation for this because we want it to trigger a resize:
	const isPresent = useIsPresent()
	const value = isPresent ? _value : 0

	const { forceUpdate } = React.useContext(RootContext)
	const [width, setWidth] = React.useState<`${number}em`>()
	React.useEffect(() => {
		// Skip setting the width if this is the first render and it's not going to animate:
		if (isInitialRender && initialValue === value) return
		if (!numberRefs.current[value]) return
		const w = `${getWidthInEm(numberRefs.current[value])}em` as const
		// Put the target width on the el immediately, so it can be used for the section resize
		if (ref.current) ref.current.dataset.targetWidth = w
		// Trigger the actual layout animation by causing another render:
		setWidth(w)
		forceUpdate()
	}, [value])

	const renderNumber = (i: number) => (
		<span
			key={i}
			aria-hidden={i !== value}
			style={{ userSelect: i === value ? undefined : 'none' }}
			ref={(r) => void (numberRefs.current[i] = r)}
			// @ts-expect-error React doesn't support inert yet
			inert={i === value ? undefined : ''}
		>
			{i}
		</span>
	)

	const above = []
	for (let i = 0; i < initialValue; i++) {
		above.push(renderNumber(i))
	}
	const below = []
	for (let i = initialValue + 1; i <= 9; i++) {
		below.push(renderNumber(i))
	}

	const { justify } = React.useContext(SectionContext)

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout="position"
			data-exiting={isPresent ? undefined : ''}
			data-motion-number-digit={value}
			style={{
				display: 'inline-flex',
				justifyContent: 'center',
				width
			}}
		>
			{/* Position correction, needed because the children are center-aligned within the parent: */}
			<motion.span
				layout={justify === 'right' ? 'position' : false}
				style={{ display: 'inline-flex', justifyContent: 'center' }}
			>
				{/* This needs to be separate so the layout animation doesn't affect its y: */}
				<motion.span
					ref={measuredRef}
					style={{
						display: 'inline-flex',
						flexDirection: 'column',
						alignItems: 'center',
						position: 'relative'
					}}
					initial={{ y: 0 }}
					animate={{ y: `${(initialValue - value) * 100}%` }}
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
					{renderNumber(initialValue)}
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

const Sym = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> &
		Rename<Rename<KeyedSymbolPart, 'key', 'partKey'>, 'value', 'children'>
>(function Sym({ partKey: key, type, children: value, ...rest }, ref) {
	const isPresent = useIsPresent()
	const { justify } = React.useContext(SectionContext)

	return (
		<motion.span
			{...rest}
			ref={ref}
			data-exiting={isPresent ? undefined : ''}
			data-motion-number-part={type}
			data-motion-number-value={value}
			style={{
				display: 'inline-flex',
				justifyContent: justify,
				position: 'relative' // needed for AnimatePresent popLayout
			}}
			layout="position"
		>
			<JustifiedAnimatePresence mode="popLayout" justify={justify} initial={false}>
				<motion.span
					key={value} // re-create on value change
					layout={justify === 'right' ? 'position' : false} // we only need to correct for right-aligned ones
					ref={ref}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					style={{
						display: 'inline-block',
						whiteSpace: 'pre' // some symbols are spaces or thin spaces
					}}
				>
					{value}
				</motion.span>
			</JustifiedAnimatePresence>
		</motion.span>
	)
})
