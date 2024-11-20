'use client'

import * as React from 'react'
import {
	type Value,
	type Format,
	type Props,
	renderInnerHTML,
	formatToData,
	type Data,
	NumberFlowLite,
	prefersReducedMotion,
	canAnimate as _canAnimate,
	define
} from 'number-flow'
import { BROWSER } from 'esm-env'
export type { Value, Format, Trend, NumberPartType } from 'number-flow'

const REACT_MAJOR = parseInt(React.version.match(/^(\d+)\./)?.[1]!)
const isReact19 = REACT_MAJOR >= 19

// Can't wait to not have to do this in React 19:
const OBSERVED_ATTRIBUTES = ['data'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]
export class NumberFlowElement extends NumberFlowLite {
	static observedAttributes = isReact19 ? [] : OBSERVED_ATTRIBUTES
	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
		this[attr] = JSON.parse(newValue)
	}
}

define('number-flow-react', NumberFlowElement)

type BaseProps = React.HTMLAttributes<NumberFlowElement> &
	Partial<Props> & {
		isolate?: boolean
		willChange?: boolean
		onAnimationsStart?: (e: CustomEvent<undefined>) => void
		onAnimationsFinish?: (e: CustomEvent<undefined>) => void
	}

type NumberFlowImplProps = BaseProps & {
	innerRef: React.MutableRefObject<NumberFlowElement | undefined>
	data: Data
}

// You're supposed to cache these between uses:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
// Serialize to strings b/c React:
const formatters: Record<string, Intl.NumberFormat> = {}

// Tiny workaround to support React 19 until it's released:
const serializeData = isReact19 ? (p: Data) => p : JSON.stringify

function splitProps<T extends Record<string, any>>(props: T): [Props, Omit<T, keyof Props>] {
	const {
		transformTiming,
		spinTiming,
		opacityTiming,
		animated,
		respectMotionPreference,
		trend,
		continuous,
		...rest
	} = props

	return [
		{
			transformTiming,
			spinTiming,
			opacityTiming,
			animated,
			respectMotionPreference,
			trend,
			continuous
		},
		rest
	]
}

type NumberFlowImplState = {}
type NumberFlowImplSnapshot = boolean
// We need a class component to use getSnapshotBeforeUpdate:
class NumberFlowImpl extends React.Component<
	NumberFlowImplProps,
	NumberFlowImplState,
	NumberFlowImplSnapshot
> {
	constructor(props: NumberFlowImplProps) {
		super(props)
		this.handleRef = this.handleRef.bind(this)
	}

	// Update the non-`data` props to avoid JSON serialization
	// Data needs to be set in render still:
	updateNonDataProps(prevProps?: Readonly<NumberFlowImplProps>) {
		if (!this.#el) return

		this.#el.manual = !this.props.isolate
		const [nonData] = splitProps(this.props)
		Object.entries(nonData).forEach(([k, v]) => {
			this.#el![k as keyof Props] = v ?? NumberFlowElement.defaultProps[k as keyof Props]
		})

		if (prevProps?.onAnimationsStart)
			this.#el.removeEventListener('animationsstart', prevProps.onAnimationsStart as EventListener)
		if (this.props.onAnimationsStart)
			this.#el.addEventListener('animationsstart', this.props.onAnimationsStart as EventListener)

		if (prevProps?.onAnimationsFinish)
			this.#el.removeEventListener(
				'animationsfinish',
				prevProps.onAnimationsFinish as EventListener
			)
		if (this.props.onAnimationsFinish)
			this.#el.addEventListener('animationsfinish', this.props.onAnimationsFinish as EventListener)
	}

	override componentDidMount() {
		this.updateNonDataProps()
		if (isReact19 && this.#el) {
			// React 19 needs this because the attributeChangedCallback isn't called:
			this.#el.data = this.props.data
		}
	}

	override getSnapshotBeforeUpdate(prevProps: Readonly<NumberFlowImplProps>) {
		this.updateNonDataProps(prevProps)
		if (
			this.props.isolate ||
			this.props.animated === false /* totally optional optimization */ ||
			prevProps.data === this.props.data
		)
			return false
		this.#el?.willUpdate()
		return true
	}

	override componentDidUpdate(
		_: Readonly<NumberFlowImplProps>,
		__: NumberFlowImplState,
		snapshot: NumberFlowImplSnapshot
	) {
		if (snapshot) this.#el?.didUpdate()
	}

	#el?: NumberFlowElement

	handleRef(el: NumberFlowElement) {
		if (this.props.innerRef) this.props.innerRef.current = el
		this.#el = el
	}

	override render() {
		const [
			_,
			{
				innerRef,
				className,
				data,
				willChange,
				isolate,
				onAnimationsStart,
				onAnimationsFinish,
				...rest
			}
		] = splitProps(this.props)

		return (
			// @ts-expect-error missing types
			<number-flow-react
				ref={this.handleRef}
				data-will-change={willChange ? '' : undefined}
				// Have to rename this:
				class={className}
				aria-label={data.valueAsString}
				{...rest}
				role="img"
				dangerouslySetInnerHTML={{ __html: BROWSER ? '' : renderInnerHTML(data) }}
				suppressHydrationWarning
				// Make sure data is set last, everything else is updated:
				data={serializeData(data)}
			/>
		)
	}
}

export type NumberFlowProps = BaseProps & {
	value: Value
	locales?: Intl.LocalesArgument
	format?: Format
	prefix?: string
	suffix?: string
}

const NumberFlow = React.forwardRef<NumberFlowElement, NumberFlowProps>(function NumberFlow(
	{ value, locales, format, prefix, suffix, ...props },
	_ref
) {
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const ref = React.useRef<NumberFlowElement>()

	const localesString = React.useMemo(() => (locales ? JSON.stringify(locales) : ''), [locales])
	const formatString = React.useMemo(() => (format ? JSON.stringify(format) : ''), [format])
	const data = React.useMemo(() => {
		const formatter = (formatters[`${localesString}:${formatString}`] ??= new Intl.NumberFormat(
			locales,
			format
		))
		return formatToData(value, formatter, prefix, suffix)
	}, [value, localesString, formatString, prefix, suffix])

	return <NumberFlowImpl {...props} data={data} innerRef={ref} />
})

export default NumberFlow

// SSR-safe canAnimate
export function useCanAnimate({ respectMotionPreference = true } = {}) {
	const [canAnimate, setCanAnimate] = React.useState(_canAnimate)
	const [reducedMotion, setReducedMotion] = React.useState(false)

	// Handle SSR:
	React.useEffect(() => {
		setCanAnimate(_canAnimate)
		setReducedMotion(prefersReducedMotion?.matches ?? false)
	}, [])

	// Listen for reduced motion changes if needed:
	React.useEffect(() => {
		if (!respectMotionPreference) return
		const onChange = ({ matches }: MediaQueryListEvent) => {
			setReducedMotion(matches)
		}
		prefersReducedMotion?.addEventListener('change', onChange)
		return () => {
			prefersReducedMotion?.removeEventListener('change', onChange)
		}
	}, [respectMotionPreference])

	return canAnimate && (!respectMotionPreference || !reducedMotion)
}
