'use client'

import * as React from 'react'
import {
	type Value,
	type Format,
	SlottedTag,
	slottedStyles,
	partitionParts,
	type PartitionedParts,
	NumberFlowLite,
	supportsLinear
} from 'number-flow'
export { defaultXTiming, defaultSpinTiming } from 'number-flow'
export type * from 'number-flow'

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

export type NumberFlowProps = React.HTMLAttributes<NumberFlowElement> & {
	value: Value
	locales?: Intl.LocalesArgument
	format?: Format
	isolate?: boolean
	trend?: (typeof NumberFlowElement)['prototype']['trend']
	fadeTiming?: (typeof NumberFlowElement)['prototype']['fadeTiming']
	xTiming?: (typeof NumberFlowElement)['prototype']['xTiming']
	spinTiming?: (typeof NumberFlowElement)['prototype']['spinTiming']
}

type NumberFlowPrivProps = Omit<NumberFlowProps, 'value' | 'locales' | 'format'> & {
	innerRef: React.MutableRefObject<NumberFlowElement | undefined>
	parts: PartitionedParts
}

// You're supposed to cache these between uses:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
// Serialize to strings b/c React:
const formatters: Record<string, Intl.NumberFormat> = {}

// We need a class component to use getSnapshotBeforeUpdate:
class NumberFlowPriv extends React.Component<NumberFlowPrivProps> {
	constructor(props: NumberFlowPrivProps) {
		super(props)
		this.handleRef = this.handleRef.bind(this)
	}

	// Update the non-parts props to avoid JSON serialization
	// Parts needs to be set in render still:
	updateNonPartsProps() {
		if (this.#el) {
			this.#el.manual = !this.props.isolate
			if (this.props.trend != null) this.#el.trend = this.props.trend
			if (this.props.fadeTiming) this.#el.fadeTiming = this.props.fadeTiming
			if (this.props.xTiming) this.#el.xTiming = this.props.xTiming
			if (this.props.spinTiming) this.#el.spinTiming = this.props.spinTiming
		}
	}

	override componentDidMount() {
		this.updateNonPartsProps()
	}

	override getSnapshotBeforeUpdate() {
		this.updateNonPartsProps()
		if (!this.props.isolate) this.#el?.willUpdate()
		return null
	}

	override componentDidUpdate() {
		if (!this.props.isolate) this.#el?.didUpdate()
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
			// These are set in updateNonPartsProps, so ignore them here:
			isolate,
			trend,
			fadeTiming,
			xTiming,
			spinTiming,
			...rest
		} = this.props

		return (
			// @ts-expect-error missing types
			<number-flow
				ref={this.handleRef}
				// Have to rename this:
				class={className}
				{...rest}
				// Make sure parts are set last, everything else is updated:
				parts={JSON.stringify(parts)}
			>
				<SlottedTag style={slottedStyles}>{parts.formatted}</SlottedTag>
				{/* @ts-expect-error missing types */}
			</number-flow>
		)
	}
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

	return <NumberFlowPriv {...props} parts={parts} innerRef={ref} />
})

export default NumberFlow

// SSR-safe supportsLinear
export function useSupportsLinear() {
	const [supported, setSupported] = React.useState(false)

	React.useEffect(() => {
		setSupported(supportsLinear)
	}, [])

	return supported
}

type LinearEasing = `linear(${string})`
type LinearTiming = EffectTiming & { easing: LinearEasing }

function useLinear(linear: LinearEasing, fallback: string): string
function useLinear(linear: LinearTiming, fallback: EffectTiming): EffectTiming
function useLinear(
	linear: LinearEasing | LinearTiming,
	fallback: string | EffectTiming
): string | EffectTiming {
	const supported = useSupportsLinear()
	return supported ? linear : fallback
}

export { useLinear }
