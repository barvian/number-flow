import * as React from 'react'
import NumberFlowElement, { type Value, type Format, renderInnerHTML } from 'number-flow'
export type * from 'number-flow'
import { BROWSER } from 'esm-env'

export type NumberFlowProps = React.HTMLAttributes<NumberFlowElement> & {
	value: Value
	locales?: Intl.LocalesArgument
	format?: Format
	dsd?: boolean
}

type NumberFlowPrivProps = NumberFlowProps & {
	innerRef: React.MutableRefObject<NumberFlowElement | undefined>
}

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
		const { innerRef, value, className, locales, format, dsd, ...rest } = this.props

		return (
			// @ts-expect-error
			<number-flow
				ref={this.handleRef}
				class={className}
				{...rest}
				suppressHydrationWarning
				dangerouslySetInnerHTML={
					BROWSER ? undefined : { __html: renderInnerHTML(value, { locales, format, dsd }) }
				}
				manual
				// Make sure value is set last, so timings can be updated beforehand.
				// window check ensures no double update in React 18.
				// Should be able to do value={[value,...]} in React 19:
				value={BROWSER ? JSON.stringify([value, locales, format]) : undefined}
			/>
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
