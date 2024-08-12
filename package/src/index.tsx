import * as React from 'react'
import {
	AnimatePresence,
	LayoutGroup,
	motion,
	addScaleCorrector,
	type HTMLMotionProps,
	MotionConfig,
	easeOut,
	usePresence,
	type AnimatePresenceProps
} from 'framer-motion'
import PopChildRight from './PopChildRight'

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

function useMounted() {
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])
	return mounted
}

function useRefs<T>(length: number, initial: T | null = null) {
	const ref = React.useRef(new Array<typeof initial>(length).fill(initial))
	React.useEffect(() => {
		ref.current = ref.current.slice(0, length)
	}, [length])
	return ref.current
}

// Stolen from Framer Motion, ensures the value is never re-created (unlike useMemo):
function useConstant<T>(init: () => T) {
	const ref = React.useRef<T | null>(null)

	if (ref.current === null) {
		ref.current = init()
	}

	return ref.current
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
	// let exponentSymbol: string | undefined
	// let exponent = ''

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
			// case 'exponentSeparator':
			// 	exponentSymbol = part.value
			// 	break
			// // Add these as strings because they'll get parsed as numbers later:
			// case 'exponentMinusSign':
			// case 'exponentInteger':
			// 	exponent += part.value
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

	return [pre, integer, fraction, post] as const
}

const DEFAULT_TRANSITION = {
	duration: 0.5,
	ease: easeOut,
	layout: { type: 'spring', duration: 1, bounce: 0 },
	y: { type: 'spring', duration: 1, bounce: 0 }
}

const MotionNumberContext = React.createContext<{
	mounted: boolean
	onRootLayoutAnimationComplete?: (listener: () => void) => () => void
}>({
	mounted: false
})

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

export type MotionNumberProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
	value: number | bigint | string
	locales?: Intl.LocalesArgument
	format?: Intl.NumberFormatOptions
	transition?: React.ComponentProps<typeof MotionConfig>['transition']
}

const MotionNumber = React.forwardRef<HTMLSpanElement, MotionNumberProps>(
	(
		{
			value,
			locales,
			format,
			onLayoutAnimationComplete,
			transition = DEFAULT_TRANSITION,
			style,
			...rest
		},
		ref
	) => {
		// Split the number into parts
		const parts = React.useMemo(
			() => formatToParts(value, { locales, format }),
			[value, locales, format]
		)
		// Abort if invalid
		if (!parts) return value

		const keys = parts.flatMap((p) => p.map((p) => p.key)).join('|')
		const [pre, integer, fraction, post] = parts

		const maskedRef = React.useRef<HTMLSpanElement>(null)
		const mounted = useMounted()
		// const id = React.useId()

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

		const layoutEndListeners = useConstant(() => new Set<() => void>())
		const onRootLayoutAnimationComplete = (listener: () => void) => {
			layoutEndListeners.add(listener)
			return () => layoutEndListeners.delete(listener)
		}

		return (
			<MotionNumberContext.Provider value={{ mounted, onRootLayoutAnimationComplete }}>
				<MotionConfig transition={transition}>
					<LayoutGroup
					// id={id} // not needed until layoutId works, see note in <Section>
					>
						<motion.span
							{...rest}
							layout // use full layout animation so onLayoutAnimationComplete handles every change
							layoutDependency={keys}
							onLayoutAnimationComplete={() => {
								onLayoutAnimationComplete?.()
								layoutEndListeners.forEach((listener) => listener())
							}}
							style={{
								...style,
								display: 'inline-block',
								isolation: 'isolate', // so number can be underneath pre/post
								whiteSpace: 'nowrap'
							}}
						>
							<Section data-motion-number-part="pre" justify="end" mode="popLayout" parts={pre} />
							<motion.span
								layout // make sure this one scales
								layoutDependency={keys}
								ref={maskedRef}
								style={{
									display: 'inline-block',
									// Activates the scale correction, which gets stored in --motion-number-scale-x-correction
									'--motion-number-scale-x-correct': 1,
									margin: '0 calc(-1*var(--mask-width,0.5em))',
									padding: '0 var(--mask-width,0.5em)',
									position: 'relative',
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
								<Section data-motion-number-part="integer" justify="end" parts={integer} />
								<Section data-motion-number-part="fraction" parts={fraction} />
							</motion.span>
							<Section data-motion-number-part="post" mode="popLayout" parts={post} />
						</motion.span>
					</LayoutGroup>
				</MotionConfig>
			</MotionNumberContext.Provider>
		)
	}
)

export default MotionNumber

const Section = React.forwardRef<
	HTMLSpanElement,
	Omit<React.ReactHTML['span'], 'children'> & {
		parts: KeyedNumberPart[]
		justify?: 'start' | 'end'
		mode?: AnimatePresenceProps['mode']
	}
>(({ parts, justify = 'start', mode, ...rest }, _ref) => {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])

	const measuredRef = React.useRef<HTMLSpanElement>(null)
	const { mounted } = React.useContext(MotionNumberContext)

	const [width, setWidth] = React.useState<`${number}em`>()
	React.useEffect(() => {
		if (!measuredRef.current) return
		// Find the new width by hiding exiting elements and measuring the measuredRef
		// This better handles i.e. negative margins between elements
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
		targetingWidths.forEach((el, i) => {
			el.style.width = prevWidths[i]
		})
		exiting.forEach((el) => {
			el.style.display = 'inline-flex'
			el.removeAttribute('hidden')
		})
	}, [parts.map((p) => p.key).join('|')])

	// Skip the re-render for the initial width measurement:
	React.useEffect(() => {
		if (!ref.current || !measuredRef.current) return
		ref.current.style.width = `${getWidthInEm(measuredRef.current)}em`
	}, [])

	return (
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
					justifyContent: 'inherit'
				}}
			>
				&#8203;
				<AnimatePresence
					mode={mode === 'popLayout' && justify === 'end' ? 'sync' : mode}
					initial={false}
				>
					{mode === 'popLayout' && justify === 'end'
						? parts.map((part) => (
								<PopChildRight key={getReactKey(part)}>{renderPart(part)}</PopChildRight>
							))
						: parts.map((part) => renderPart(part, getReactKey(part)))}
				</AnimatePresence>
			</span>
		</span>
	)
})

const renderPart = (part: KeyedNumberPart, key?: string) =>
	part.type === 'integer' || part.type === 'fraction' ? (
		<Digit
			key={key}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			value={part.value}
		/>
	) : (
		<Symbol
			key={key} // if layoutId ever works: key={`${key}:${value}`}
			type={part.type}
			partKey={part.key}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			// unfortunately this is too buggy, probably b/c AnimatePresence wraps everything, but it'd simplify <Symbol> a lot:
			// layoutId={part.type === 'literal' ? `${part.key}:${part.value}` : part.key}
		>
			{part.value}
		</Symbol>
	)

const getReactKey = (part: KeyedNumberPart) =>
	part.type === 'literal' ? `${part.key}:${part.value}` : part.key

function useRemoveOnRootLayoutAnimationComplete() {
	const { onRootLayoutAnimationComplete } = React.useContext(MotionNumberContext)
	const [isPresent, safeToRemove] = usePresence()
	React.useEffect(() => {
		if (!isPresent) return onRootLayoutAnimationComplete?.(safeToRemove)
	}, [isPresent, onRootLayoutAnimationComplete])
	return isPresent
}

const Digit = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> & {
		value: number
	}
>(({ value: _value, ...rest }, _ref) => {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])

	const { mounted } = React.useContext(MotionNumberContext)
	const measuredRef = React.useRef<HTMLSpanElement>(null)
	const numberRefs = useRefs<HTMLSpanElement>(10)

	const initialValue = React.useRef(mounted ? 0 : _value).current

	// Don't use a normal exit animation for this because we want it to trigger a resize:
	const isPresent = useRemoveOnRootLayoutAnimationComplete()
	const value = isPresent ? _value : 0

	const [width, setWidth] = React.useState<`${number}em`>()
	React.useEffect(() => {
		// Skip setting the width if this is the first render and it's not going to animate:
		if (!mounted && initialValue === value) return
		if (!numberRefs[value]) return
		const w = `${getWidthInEm(numberRefs[value])}em` as const
		// Put the target width on the el immediately, so it can be used for the section resize
		if (ref.current) ref.current.dataset.targetWidth = w
		// Trigger the actual layout animation by causing another render:
		setWidth(w)
	}, [value])

	const renderNumber = (i: number) => (
		<span
			key={i}
			aria-hidden={i !== value}
			style={{ userSelect: i === value ? undefined : 'none' }}
			ref={(r) => void (numberRefs[i] = r)}
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

	return (
		<motion.span
			{...rest}
			ref={ref}
			layout="position"
			layoutDependency={width}
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
				layout="position"
				layoutDependency={width}
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
					initial={{ y: '0%' }}
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

const Symbol = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> &
		Rename<Rename<KeyedSymbolPart, 'key', 'partKey'>, 'value', 'children'>
>(({ partKey: key, type, children: value, ...rest }, ref) => {
	const isPresent = useRemoveOnRootLayoutAnimationComplete()

	return (
		<motion.span
			{...rest}
			ref={ref}
			// Make sure we re-render if the value changes, to trigger any exit animation:
			data-exiting={isPresent ? undefined : ''}
			data-motion-number-part={type}
			data-motion-number-value={value}
			style={{
				display: 'inline-block'
			}}
			layout="position"
			layoutDependency={value}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				<SymbolValue
					key={value} // re-create on value change
					layout="position"
					// layoutDependency={value} // TODO: investigate why this doesn't work here
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					{value}
				</SymbolValue>
			</AnimatePresence>
		</motion.span>
	)
})

// We need a separate component for this so we can do the safeToRemove logic:
const SymbolValue = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'children'> & { children: string }
>(({ children: value, ...rest }, ref) => {
	useRemoveOnRootLayoutAnimationComplete()
	return (
		<motion.span
			{...rest}
			ref={ref}
			style={{
				display: 'inline-block'
			}}
		>
			{value === ' ' ? <>&nbsp;</> : value}
		</motion.span>
	)
})
