'use client'

import * as React from 'react'
import {
	type Value,
	type Format,
	SLOTTED_TAG,
	SLOTTED_STYLES,
	partitionParts,
	NumberFlowWithShallowAttributes as NumberFlowElement
} from 'number-flow'
export { DEFAULT_X_TIMING, DEFAULT_Y_TIMING } from 'number-flow'
export type * from 'number-flow'

NumberFlowElement.define()

export type NumberFlowProps = React.HTMLAttributes<NumberFlowElement> & {
	value: Value
	locales?: Intl.LocalesArgument
	format?: Format
	fadeTiming?: (typeof NumberFlowElement)['prototype']['fadeTiming']
	xTiming?: (typeof NumberFlowElement)['prototype']['xTiming']
	yTiming?: (typeof NumberFlowElement)['prototype']['yTiming']
}

type NumberFlowPrivProps = NumberFlowProps & {
	innerRef: React.MutableRefObject<NumberFlowElement | undefined>
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
	override getSnapshotBeforeUpdate() {
		this.#el?.willUpdate()
		return null
	}

	override componentDidUpdate() {
		this.#el?.didUpdate()
	}

	#el?: NumberFlowElement

	handleRef(el: NumberFlowElement) {
		if (this.props.innerRef) this.props.innerRef.current = el
		this.#el = el
	}

	override render() {
		const { innerRef, value, className, locales, format, fadeTiming, xTiming, yTiming, ...rest } =
			this.props

		const formatter = (formatters[
			`${locales ? JSON.stringify(locales) : ''}:${format ? JSON.stringify(format) : ''}`
		] ??= new Intl.NumberFormat(locales, format))
		const parts = partitionParts(value, formatter)

		return (
			// @ts-expect-error missing types
			<number-flow
				ref={this.handleRef}
				class={className}
				fade-timing={JSON.stringify(fadeTiming)}
				x-timing={JSON.stringify(xTiming)}
				y-timing={JSON.stringify(yTiming)}
				{...rest}
				manual
				// Make sure parts are set last, so timings can be updated beforehand.
				// window check ensures no double update in React 18.
				parts={JSON.stringify(parts)}
			>
				<SLOTTED_TAG style={SLOTTED_STYLES}>{parts.formatted}</SLOTTED_TAG>
				{/* @ts-expect-error missing types */}
			</number-flow>
		)
	}
}

const NumberFlow = React.forwardRef<NumberFlowElement, NumberFlowProps>(
	function NumberFlow(props, _ref) {
		React.useImperativeHandle(_ref, () => ref.current!, [])
		const ref = React.useRef<NumberFlowElement>()
		return <NumberFlowPriv {...props} innerRef={ref} />
	}
)

export default NumberFlow
