import * as React from 'react'
import {
	type motion,
	addScaleCorrector,
	type HTMLMotionProps,
	MotionConfig,
	easeOut,
	type AnimatePresenceProps,
	MotionConfigContext,
	useIsPresent,
	type MotionConfigProps
} from 'framer-motion'
import JustifiedAnimatePresence, { type Justify } from './JustifiedAnimatePresence'

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

export const DEFAULT_TRANSITION = {
	// We use keyframes and times so the opacity/exit animations can last
	// as long as the layout animation, so Framer Motion doesn't have to
	// remove exiting elements until the layout animation is done.
	// This worked better in testing than safeToRemove() from usePresence()
	opacity: { duration: 1, ease: easeOut, times: [0, 0.5] }, // perceptual duration of 0.5s
	layout: { type: 'spring', duration: 1, bounce: 0 },
	y: { type: 'spring', duration: 1, bounce: 0 }
} as const satisfies MotionConfigProps['transition']

// Build the mask for the numbers. Technique taken from:
// https://expensive.toys/blog/blur-vignette
const maskHeight = 'var(--mask-height, 0.15em)'
const maskWidth = 'var(--mask-width, 0.5em)'
const correctedMaskWidth = `calc(${maskWidth} / var(--motion-number-scale-x-correction, 1))`
const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}
const mask =
	// Horizontal:
	`linear-gradient(to right, transparent 0, #000 ${correctedMaskWidth}, #000 calc(100% - ${correctedMaskWidth}), transparent),` +
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
	/** @internal */
	motion?: typeof motion
}>({})

const useMotion = () => {
	const { motion } = React.useContext(MotionNumberContext)
	return motion!
}

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

const MotionNumber = React.forwardRef<
	HTMLSpanElement,
	MotionNumberProps & { motion: typeof motion }
>(function MotionNumber(
	{
		value,
		locales,
		format,
		transition: _transition,
		before,
		first,
		last,
		after,
		style,
		motion,
		...rest
	},
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
	// These batch in React 18+:
	const forceUpdate = React.useCallback(() => {
		setUpdateCount(_updateCount + 1)
	}, [_updateCount])

	// Use a more toplevel forceUpdate if it exists:
	const parent = React.useContext(MotionNumberContext)
	const context = React.useMemo(
		() => ({
			forceUpdate: parent.forceUpdate ?? forceUpdate,
			motion
		}),
		[parent, forceUpdate, motion]
	)

	return (
		<MotionNumberContext.Provider value={context}>
			<MotionConfig transition={transition}>
				{before?.()}
				<motion.span
					{...rest}
					ref={ref}
					layout // For convenience, b/c it's basically implied
					data-motion-number="" // otherwise React will add =true
					style={{
						lineHeight: 1, // make this one easy to override
						...style,
						display: 'inline-flex',
						isolation: 'isolate', // so number can be underneath first/last
						whiteSpace: 'nowrap'
					}}
				>
					{first?.()}
					<motion.span
						layout
						style={{
							display: 'inline-flex',
							direction: 'ltr', // I think this is needed b/c numbers are always LTR?
							isolation: 'isolate', // so number can be underneath pre/post
							position: 'relative',
							zIndex: -1, // so the whole number is under any first/last
							userSelect: 'none', // I think adding this to the parent then undoing it on the selectable one might work a little better
							pointerEvents: 'none'
						}}
					>
						{/* Aria-label is invalid on span tags, so include this for screen readers and also use it to improve copying: */}
						<span
							style={{
								position: 'absolute',
								left: 0,
								padding: `${maskHeight} 0`,
								pointerEvents: 'all',
								userSelect: 'text',
								color: 'transparent',
								overflow: 'clip',
								width: '100%',
								top: 0,
								zIndex: -50
							}}
						>
							{formatted}
						</span>
						<Section
							data-motion-number-part="pre"
							style={{ padding: `${maskHeight} 0` }}
							aria-hidden={true}
							// @ts-expect-error React doesn't support inert
							inert=""
							justify="right"
							mode="popLayout"
							parts={pre}
						/>
						<motion.span
							layout // make sure this one scales
							ref={maskedRef}
							aria-hidden={true}
							// @ts-expect-error React doesn't support inert
							inert=""
							style={{
								display: 'inline-flex',

								// Activates the scale correction, which gets stored in --motion-number-scale-x-correction
								'--motion-number-scale-x-correct': 1,
								margin: `0 calc(-1*${maskWidth})`,
								padding: `${maskHeight} ${maskWidth}`,
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
							{/* These last two sections need to have layout animations so that if new characters are added in-flight they know where to go: */}
							<Section data-motion-number-part="fraction" layout="position" parts={fraction} />
						</motion.span>
						<Section
							data-motion-number-part="post"
							style={{ padding: `${maskHeight} 0` }}
							aria-hidden={true}
							layout="position"
							// @ts-expect-error React doesn't support inert
							inert=""
							mode="popLayout"
							parts={post}
						/>
					</motion.span>
					{last?.()}
				</motion.span>
				{after?.()}
			</MotionConfig>
		</MotionNumberContext.Provider>
	)
})

// Exporting a named const as default is better for IntelliSense:
export default MotionNumber

const SectionContext = React.createContext({
	justify: 'left' as Justify
})

const Section = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> & {
		parts: KeyedNumberPart[]
		justify?: Justify
		mode?: AnimatePresenceProps['mode']
	}
>(function Section({ parts, justify = 'left', mode, style, ...rest }, _ref) {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const { forceUpdate } = React.useContext(MotionNumberContext)
	const motion = useMotion()

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
					// insertBefore() appends if next is null:
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
			<motion.span
				{...rest}
				ref={ref}
				style={{
					...style,
					display: 'inline-flex',
					justifyContent: justify,
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
					{/* zero width space to prevent the height from collapsing when there's no children: */}
					&#8203;
					<JustifiedAnimatePresence mode={mode} justify={justify} initial={false}>
						{parts.map((part) =>
							part.type === 'integer' || part.type === 'fraction' ? (
								<Digit
									key={part.key}
									initial={{ opacity: 0 }}
									animate={{ opacity: [null, 1] }}
									exit={{ opacity: [null, 0] }}
									value={part.value}
									initialValue={isInitialRender ? undefined : 0}
								/>
							) : (
								<Sym
									key={part.type === 'literal' ? `${part.key}:${part.value}` : part.key}
									type={part.type}
									partKey={part.key}
									initial={{ opacity: 0 }}
									animate={{ opacity: [null, 1] }}
									exit={{ opacity: [null, 0] }}
									// unfortunately this is too buggy, probably b/c AnimatePresence wraps everything, but it'd simplify <Sym> a lot:
									// layoutId={part.type === 'literal' ? `${part.key}:${part.value}` : part.key}
								>
									{part.value}
								</Sym>
							)
						)}
					</JustifiedAnimatePresence>
				</span>
			</motion.span>
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
	const motion = useMotion()

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
			style={{
				display: 'inline-block'
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
					animate={{ y: `calc(${initialValue - value} * (100% + ${maskHeight})` }}
				>
					{below && (
						<span
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								position: 'absolute',
								bottom: `calc(100% + ${maskHeight})`,
								gap: maskHeight,
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
								gap: maskHeight,
								top: `calc(100% + ${maskHeight})`,
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
	const motion = useMotion()

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
					animate={{ opacity: [null, 1] }}
					exit={{ opacity: [null, 0] }}
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
