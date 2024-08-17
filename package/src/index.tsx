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

type Em = `${number}em`

function getWidthInEm(element: HTMLElement): Em {
	const { width, fontSize } = getComputedStyle(element)
	return `${parseFloat(width) / parseFloat(fontSize)}em`
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

	let formatted = ''
	let seenInteger = false,
		seenDecimal = false
	for (const part of parts) {
		formatted += part.value

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

	return { pre, integer, fraction, post, formatted }
}

export const DEFAULT_TRANSITION: MotionConfigProps['transition'] = {
	duration: 0.5,
	ease: easeOut,
	layout: { type: 'spring', duration: 1, bounce: 0 },
	y: { type: 'spring', duration: 1, bounce: 0 }
}

// Build the mask for the numbers. Technique taken from:
// https://expensive.toys/blog/blur-vignette
const maskHeight = 'var(--mask-height, 0.15em)'
const maskWidth = 'var(--mask-width, 0.5em)'
const correctedMaskWidth = `calc(${maskWidth} / var(--motion-number-scale-x-correction, 1))`
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
	`calc(100% - ${correctedMaskWidth} * 2) 100%,` +
	`${correctedMaskWidth} ${maskHeight},` +
	`${correctedMaskWidth} ${maskHeight},` +
	`${correctedMaskWidth} ${maskHeight},` +
	`${correctedMaskWidth} ${maskHeight}`

export const MotionNumberContext = React.createContext<{
	forceUpdate?: () => void
}>({})

export type MotionNumberProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
	value: number | bigint | string
	locales?: Intl.LocalesArgument
	// Scientific and engineering notation are not supported atm:
	format?: Omit<Intl.NumberFormatOptions, 'notation'> & {
		notation?: Exclude<Intl.NumberFormatOptions['notation'], 'scientific' | 'engineering'>
	}
	transition?: React.ComponentProps<typeof MotionConfig>['transition']
	// These have to be render props for them to re-render correctly when the root state changes (ensuring proper layout animations)
	before?: () => React.ReactNode
	first?: () => React.ReactNode
	last?: () => React.ReactNode
	after?: () => React.ReactNode
}

const MotionNumber = React.forwardRef<HTMLSpanElement, MotionNumberProps>(function MotionNumber(
	{ value, locales, format, transition: _transition, before, first, last, after, style, ...rest },
	ref
) {
	// Split the number into parts
	const parts = React.useMemo(
		() => formatToParts(value, { locales, format }),
		[value, locales, format]
	)
	const { pre, integer, fraction, post, formatted } = parts

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
	const transition = _transition ?? motionConfigTransition ?? DEFAULT_TRANSITION

	// This is essentially what <LayoutGroup> does, except <LayoutGroup> gave worse performance:
	const [_updateCount, setUpdateCount] = React.useState(0)
	// These should be batched in React 18+:
	const forceUpdate = React.useCallback(() => {
		setUpdateCount(_updateCount + 1)
	}, [_updateCount])

	// Use a more toplevel forceUpdate if it exists:
	const parent = React.useContext(MotionNumberContext)
	const context = React.useMemo(
		() => ({
			forceUpdate: parent.forceUpdate ?? forceUpdate
		}),
		[parent, forceUpdate]
	)

	return (
		<MotionNumberContext.Provider value={context}>
			<MotionConfig transition={transition}>
				{before?.()}
				<motion.span
					{...rest}
					layout // This is basically implied b/c of all the characters, and needed because Section doesn't use one
					data-motion-number="" // otherwise React will add =true
					style={{
						lineHeight: 1, // make this one easy to override
						...style,
						display: 'inline-flex',
						alignItems: 'baseline',
						isolation: 'isolate', // so number can be underneath first/last
						whiteSpace: 'nowrap'
					}}
				>
					{first?.()}
					<motion.span
						layout
						style={{
							alignItems: 'baseline',
							direction: 'ltr', // I think this is needed b/c numbers are always LTR?
							isolation: 'isolate', // so number can be underneath pre/post
							position: 'relative',
							zIndex: -1, // so the whole number is under any pre/post
							userSelect: 'none', // I think adding this to the parent then undoing it on the selectable one might work a little better
							pointerEvents: 'none'
						}}
					>
						{/* Aria-label is invalid on span tags, so include this for screen readers and also use it to improve copying: */}
						<span
							style={{
								position: 'absolute',
								left: 0,
								top: maskHeight,
								pointerEvents: 'all',
								fontKerning: 'none', // to match the rendered number
								userSelect: 'text',
								color: 'transparent',
								zIndex: -50
							}}
						>
							{formatted}
						</span>
						<span
							aria-hidden={true}
							// @ts-expect-error React doesn't support inert
							inert=""
						>
							<Section data-motion-number-part="pre" justify="right" mode="popLayout" parts={pre} />
							<motion.span
								layout // make sure this one scales
								ref={maskedRef}
								style={{
									display: 'inline-flex',
									alignItems: 'baseline',

									// Activates the scale correction, which gets stored in --motion-number-scale-x-correction
									'--motion-number-scale-x-correct': 1,
									margin: `0 calc(-1*${maskWidth})`,
									padding: `0 ${maskWidth}`,
									position: 'relative', // for zIndex
									zIndex: -1, // should be underneath everything else
									overflow: 'clip', // important so it doesn't affect page layout
									// Prefixed properties have better support than unprefixed ones:
									WebkitMaskImage: mask,
									WebkitMaskSize: maskSize,
									WebkitMaskPosition:
										'center, center, top left, top right, bottom right, bottom left',
									WebkitMaskRepeat: 'no-repeat'
								}}
							>
								<Section data-motion-number-part="integer" justify="right" parts={integer} />
								<Section data-motion-number-part="fraction" parts={fraction} />
							</motion.span>
							<Section data-motion-number-part="post" mode="popLayout" parts={post} />
						</span>
					</motion.span>
					{last?.()}
				</motion.span>
				{after?.()}
			</MotionConfig>
		</MotionNumberContext.Provider>
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
	const { forceUpdate } = React.useContext(MotionNumberContext)

	const context = React.useMemo(() => ({ justify }), [justify])

	const measuredRef = React.useRef<HTMLSpanElement>(null)
	const isInitialRender = useIsInitialRender()

	// Keep a fixed width for the section, so that new characters get added to the end before the layout
	// animation starts, which makes them look like they were there already:
	const [width, setWidth] = React.useState<Em>()
	React.useEffect(() => {
		if (!measuredRef.current) return
		if (isInitialRender) {
			if (ref.current) ref.current.style.width = getWidthInEm(measuredRef.current)
			return
		}

		// Find the new width by removing exiting elements, measuring the measuredRef, and re-adding them
		// This better handles i.e. negative margins between elements.
		// We query the DOM because AnimatePresence overwrites ref props if the mode=popLayout

		const undos = Array.from(measuredRef.current.children).map((child) => {
			if (!(child instanceof HTMLElement)) return
			if (child.dataset.motionNumberState === 'exiting') {
				const next = child.nextSibling
				child.remove()
				return () => {
					measuredRef.current?.insertBefore(child, next)
				}
			}

			const newWidth = targetWidths.get(child)
			if (!newWidth) return
			const oldWidth = child.style.width
			child.style.width = newWidth
			return () => {
				child.style.width = oldWidth
			}
		})
		// Measure the resulting width:
		setWidth(getWidthInEm(measuredRef.current))
		// Then undo immediately:
		for (let i = undos.length - 1; i >= 0; i--) undos[i]?.()
		// Trigger a parent render/layout:
		forceUpdate?.()
	}, [parts.map((p) => p.value).join('')])

	return (
		<SectionContext.Provider value={context}>
			<span
				{...rest}
				ref={ref}
				style={{
					display: 'inline-flex',
					alignItems: 'baseline',

					justifyContent: justify,
					width
				}}
			>
				<span
					ref={measuredRef}
					style={{
						display: 'inline-flex',
						alignItems: 'baseline',
						justifyContent: 'inherit',
						position: 'relative' // needed for AnimatePresent popLayout
					}}
				>
					{/* zero width space to prevent the height from collapsing when there's no children: */}
					&#8288;
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

const targetWidths = new WeakMap<HTMLElement, Em>()

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

	const { forceUpdate } = React.useContext(MotionNumberContext)
	const [width, setWidth] = React.useState<Em>()
	React.useEffect(() => {
		// Skip setting the width if this is the first render and it's not going to animate:
		if (isInitialRender && initialValue === value) return
		if (!numberRefs.current[value]) return
		const w = getWidthInEm(numberRefs.current[value])
		// Store the target width immediately, so it can be used for the section resize:
		if (ref.current) targetWidths.set(ref.current, w)
		// Trigger the actual layout animation by causing another render:
		setWidth(w)
		forceUpdate?.()
	}, [value])

	const renderNumber = (i: number) => (
		<span
			key={i}
			aria-hidden={i !== value}
			style={{
				display: 'inline-block',
				// We put the mask height on here, so that it's easier to compute the y.
				// It should be safe, because there's guaranteed to be a number visible at all times.
				padding: `calc(${maskHeight}/2) 0`
			}}
			ref={(r) => void (numberRefs.current[i] = r)}
		>
			{i}
		</span>
	)

	const below =
		initialValue === 0 ? null : new Array(initialValue).fill(null).map((_, i) => renderNumber(i))
	const above =
		initialValue === 9
			? null
			: new Array(9 - initialValue).fill(null).map((_, i) => renderNumber(initialValue + i + 1))

	const { justify } = React.useContext(SectionContext)

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout="position"
			data-motion-number-state={isPresent ? undefined : 'exiting'}
			data-motion-number-part="digit"
			data-motion-number-value={value}
			style={{
				display: 'inline-flex',
				justifyContent: 'center',
				padding: `calc(${maskHeight}/2) 0`,
				width
			}}
		>
			{/* Position correction, needed because the children are center-aligned within the parent: */}
			<motion.span layout="position" style={{ display: 'inline-flex', justifyContent: 'center' }}>
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
					{below && (
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
							{below}
						</span>
					)}
					{renderNumber(initialValue)}
					{above && (
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
							{above}
						</span>
					)}
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
			data-motion-number-state={isPresent ? undefined : 'exiting'}
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
