import * as React from 'react'
import {
	AnimatePresence,
	LayoutGroup,
	motion,
	addScaleCorrector,
	type HTMLMotionProps,
	MotionConfig,
	easeOut,
	usePresence
} from 'framer-motion'

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

const DEFAULT_TRANSITION = {
	duration: 0.3,
	ease: easeOut,
	layout: { type: 'spring', duration: 3, bounce: 0 },
	y: { type: 'spring', duration: 3, bounce: 0 }
}

export default function NumberRoll({
	value,
	locales,
	format,
	transition = DEFAULT_TRANSITION
}: {
	value: number | bigint | string
	locales?: Intl.LocalesArgument
	format?: Intl.NumberFormatOptions
	transition?: React.ComponentProps<typeof MotionConfig>['transition']
}) {
	const maskedRef = React.useRef<HTMLSpanElement>(null)

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
		if (appliedScaleSetter.current || !maskedRef.current?.style) return
		Object.defineProperty(maskedRef.current.style, '--motion-number-scale-x-correct', {
			set(v) {
				return this.setProperty('--motion-number-scale-x-correction', v)
			}
		})
		appliedScaleSetter.current = true
	}, [])

	// Build the mask
	// https://expensive.toys/blog/blur-vignette
	const maskHeight = 'min(var(--mask-height,0.5em), (100% - 1em) / 2)'
	const maskWidth = 'calc(var(--mask-width,0.25em) / var(--motion-number-scale-x-correction, 1))'
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
		<MotionConfig transition={transition}>
			<LayoutGroup id={id}>
				<span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
					{pre.map((p) => renderSymbol(p))}
					<motion.span
						layout
						ref={maskedRef}
						style={{
							display: 'inline-block',
							// Activates the scale correction, which gets stored in --motion-number-scale-x-correction
							'--motion-number-scale-x-correct': 1,
							margin: '0 calc(-1*var(--mask-width,0.25em))',
							padding: '0 var(--mask-width,0.25em)',
							overflow: 'clip',
							WebkitMaskImage: mask,
							WebkitMaskSize: maskSize,
							WebkitMaskPosition: 'center, center, top left, top right, bottom right, bottom left',
							WebkitMaskRepeat: 'no-repeat'
						}}
					>
						<Section justify="end">{integer}</Section>
						<Section>{fraction}</Section>
					</motion.span>
					{post.map((p) => renderSymbol(p))}
				</span>
			</LayoutGroup>
		</MotionConfig>
	)
}

const SectionContext = React.createContext<{
	mounted: boolean
	onLayoutAnimationComplete?: (listener: () => void) => () => void
}>({
	mounted: false
})

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

	// Use a state flag to trigger resize so updates get batched:
	const [needsResize, setNeedsResize] = React.useState(false)
	const [width, setWidth] = React.useState<number>()
	React.useLayoutEffect(() => {
		if (!needsResize || !innerRef.current) return
		// Find the new width by hiding exiting elements and measuring the innerRef
		// This better handles i.e. negative margins between elements
		const exiting = innerRef.current.querySelectorAll<HTMLSpanElement>('[data-exiting]')
		exiting.forEach((el) => {
			el.style.display = 'none'
			el.setAttribute('hidden', '') // mostly here as a style flag
		})
		setWidth(getWidthInEm(innerRef.current))
		exiting.forEach((el) => {
			el.style.display = 'inline-flex'
			el.removeAttribute('hidden')
		})
		setNeedsResize(false)
	}, [needsResize])

	// Imperatively measure initially after mount to ensure proper layout animations afterwards
	React.useLayoutEffect(() => {
		if (ref.current && innerRef.current)
			ref.current.style.width = getWidthInEm(innerRef.current) + 'em'
	}, [])

	const layoutEndListeners = useConstant(() => new Set<() => void>())
	const onLayoutAnimationComplete = (listener: () => void) => {
		layoutEndListeners.add(listener)
		return () => layoutEndListeners.delete(listener)
	}

	return (
		<SectionContext.Provider value={{ mounted, onLayoutAnimationComplete }}>
			<motion.span
				{...rest}
				ref={ref}
				layout="position"
				onLayoutAnimationComplete={() => layoutEndListeners.forEach((listener) => listener())}
				style={{
					display: 'inline-flex',
					lineHeight: 'var(--digit-line-height, 1.15)',
					justifyContent: justify,
					width: width == null ? 'auto' : `${width}em`
				}}
			>
				<span
					ref={innerRef}
					style={{
						display: 'inline-flex',
						justifyContent: 'inherit'
					}}
				>
					&#8203;{/* Zero-width space to prevent height transitions */}
					<AnimatePresence initial={false}>
						{children.map((part, i) =>
							part.type === 'integer' || part.type === 'fraction' ? (
								<SectionRoll
									// ref={(r) => void (partRefs[i] = r)}
									key={part.key}
									layoutId={part.key}
									initialValue={mounted ? 0 : part.value}
									initial={mounted ? { opacity: 0 } : {}}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									value={part.value}
									onResize={() => {
										setNeedsResize(true)
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
								>
									{part.value}
								</SectionSymbol>
							)
						)}
					</AnimatePresence>
				</span>
			</motion.span>
		</SectionContext.Provider>
	)
})

const SectionRoll = React.forwardRef<
	HTMLSpanElement,
	Omit<HTMLMotionProps<'span'>, 'onResize'> & {
		value: number
		initialValue?: number
		onResize?: () => void
	}
>(({ value: _value, initialValue: _initialValue = _value, onResize, ...rest }, ref) => {
	const initialValue = React.useRef(_initialValue).current // Non-reactive

	const { mounted, onLayoutAnimationComplete } = React.useContext(SectionContext)
	const innerRef = React.useRef<HTMLSpanElement>(null)
	const numberRefs = useRefs<HTMLSpanElement>(10)

	// Don't use a normal exit animation for this because we want it to trigger a resize:
	const [isPresent, safeToRemove] = usePresence()
	const value = isPresent ? _value : 0

	const [width, setWidth] = React.useState<number>()
	React.useEffect(() => {
		// Skip setting the width if this is the first render and it's not going to animate:
		if (!mounted && initialValue === value) return
		if (!numberRefs[value]) return
		const w = getWidthInEm(numberRefs[value])
		setWidth(w)
	}, [value])

	// Wait until any width changes have been committed before emitting:
	React.useEffect(() => {
		if (width != null) onResize?.()
	}, [width])

	// Remove when parent layout animation is done
	React.useEffect(() => {
		if (!isPresent) return onLayoutAnimationComplete?.(safeToRemove)
	}, [isPresent, onLayoutAnimationComplete])

	const renderDigit = (i: number) => (
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
	for (let i = 9; i > initialValue; i--) {
		above.push(renderDigit(i))
	}
	const below = []
	for (let i = initialValue - 1; i >= 0; i--) {
		below.push(renderDigit(i))
	}

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
				width: width == null ? 'auto' : `${width}em`
			}}
		>
			{/* Position correction, needed because the children are center-aligned within the parent: */}
			<motion.span layout="position" style={{ display: 'inline-flex', justifyContent: 'center' }}>
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
	HTMLMotionProps<'span'> & Rename<Rename<KeyedSymbolPart, 'key', 'partKey'>, 'value', 'children'>
>(({ partKey: key, type, children: value, ...rest }, ref) => {
	const { onLayoutAnimationComplete } = React.useContext(SectionContext)
	const [isPresent, safeToRemove] = usePresence()
	React.useEffect(() => {
		if (!isPresent) return onLayoutAnimationComplete?.(safeToRemove)
	}, [isPresent, onLayoutAnimationComplete])

	return (
		<motion.span
			{...rest}
			ref={ref}
			// Make sure we re-render if the value changes, to trigger the exit animation:
			key={`${key}:${value}`}
			data-exiting={isPresent ? undefined : ''}
			{...{ [`data-motion-number-${type}`]: value }}
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
