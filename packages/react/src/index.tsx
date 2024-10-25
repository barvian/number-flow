'use client'

import * as React from 'react'
import {
	type Value,
	type Format,
	type Props,
	render,
	partitionParts,
	type PartitionedParts,
	NumberFlowLite,
	prefersReducedMotion,
	canAnimate as _canAnimate
} from 'number-flow'
export type { Value, Format, Trend } from 'number-flow'

const isReact19 = React.version.startsWith('19.')

// Can't wait to not have to do this in React 19:
const OBSERVED_ATTRIBUTES = ['parts'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]
export class NumberFlowElement extends NumberFlowLite {
	static observedAttributes = OBSERVED_ATTRIBUTES
	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
		this[attr] = JSON.parse(newValue)
	}
}

NumberFlowElement.define()

type BaseProps = React.HTMLAttributes<NumberFlowElement> &
	Partial<Omit<Props, 'manual'>> & {
		isolate?: boolean
		willChange?: boolean
		onAnimationsStart?: () => void
		onAnimationsFinish?: () => void
	}

type NumberFlowImplProps = BaseProps & {
	innerRef: React.MutableRefObject<NumberFlowElement | undefined>
	parts: PartitionedParts
}

// You're supposed to cache these between uses:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
// Serialize to strings b/c React:
const formatters: Record<string, Intl.NumberFormat> = {}

// Tiny workaround to support React 19 until it's released:
const serializeParts = isReact19 ? (p: PartitionedParts) => p : JSON.stringify

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

	// Update the non-`parts` props to avoid JSON serialization
	// Parts needs to be set in render still:
	updateNonPartsProps(prevProps?: Readonly<NumberFlowImplProps>) {
		if (!this.#el) return

		this.#el.manual = !this.props.isolate
		if (this.props.animated != null) this.#el.animated = this.props.animated
		if (this.props.respectMotionPreference != null)
			this.#el.respectMotionPreference = this.props.respectMotionPreference
		if (this.props.trend != null) this.#el.trend = this.props.trend
		if (this.props.continuous != null) this.#el.continuous = this.props.continuous
		if (this.props.opacityTiming) this.#el.opacityTiming = this.props.opacityTiming
		if (this.props.transformTiming) this.#el.transformTiming = this.props.transformTiming
		if (this.props.spinTiming) this.#el.spinTiming = this.props.spinTiming

		if (prevProps?.onAnimationsStart)
			this.#el.removeEventListener('animationsstart', prevProps.onAnimationsStart)
		if (this.props.onAnimationsStart)
			this.#el.addEventListener('animationsstart', this.props.onAnimationsStart)

		if (prevProps?.onAnimationsFinish)
			this.#el.removeEventListener('animationsfinish', prevProps.onAnimationsFinish)
		if (this.props.onAnimationsFinish)
			this.#el.addEventListener('animationsfinish', this.props.onAnimationsFinish)
	}

	override componentDidMount() {
		this.updateNonPartsProps()
		if (isReact19 && this.#el) {
			// React 19 needs this because the attributeChangedCallback isn't called:
			this.#el.parts = this.props.parts
		}
	}

	override getSnapshotBeforeUpdate(prevProps: Readonly<NumberFlowImplProps>) {
		this.updateNonPartsProps(prevProps)
		if (this.props.isolate) return false
		if (prevProps.parts === this.props.parts) return false
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
		const {
			innerRef,
			className,
			parts,
			willChange,
			// These are set in updateNonPartsProps, so ignore them here:
			animated,
			respectMotionPreference,
			isolate,
			trend,
			continuous,
			opacityTiming,
			transformTiming,
			spinTiming,
			...rest
		} = this.props

		return (
			// @ts-expect-error missing types
			<number-flow
				ref={this.handleRef}
				data-will-change={willChange ? '' : undefined}
				// Have to rename this:
				class={className}
				{...rest}
				dangerouslySetInnerHTML={{ __html: render({ formatted: parts.formatted, willChange }) }}
				// Make sure parts are set last, everything else is updated:
				parts={serializeParts(parts)}
			/>
		)
	}
}

export type NumberFlowProps = BaseProps & {
	value: Value
	locales?: Intl.LocalesArgument
	format?: Format
}

const NumberFlow = React.forwardRef<NumberFlowElement, NumberFlowProps>(function NumberFlow(
	{ value, locales, format, ...props },
	_ref
) {
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const ref = React.useRef<NumberFlowElement>()

	const localesString = React.useMemo(() => (locales ? JSON.stringify(locales) : ''), [locales])
	const formatString = React.useMemo(() => (format ? JSON.stringify(format) : ''), [format])
	const parts = React.useMemo(() => {
		const formatter = (formatters[`${localesString}:${formatString}`] ??= new Intl.NumberFormat(
			locales,
			format
		))
		return partitionParts(value, formatter)
	}, [value, localesString, formatString])

	return <NumberFlowImpl {...props} parts={parts} innerRef={ref} />
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
