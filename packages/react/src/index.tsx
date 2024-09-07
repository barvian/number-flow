import * as React from 'react'
import NumberFlowElement, { type Value, type Format, renderInnerHTML } from 'number-flow'
export type * from 'number-flow'

const NumberFlow = React.forwardRef<
	NumberFlowElement,
	React.HTMLAttributes<NumberFlowElement> & {
		value: Value
		locales?: Intl.LocalesArgument
		format?: Format
	}
>(function NumberFlow({ value, className, locales, format, ...rest }, ref) {
	return (
		// @ts-expect-error
		<number-flow
			ref={ref}
			class={className}
			{...rest}
			value={JSON.stringify([value, locales, format])}
			suppressHydrationWarning
			dangerouslySetInnerHTML={
				typeof window === 'undefined'
					? { __html: renderInnerHTML(value, locales, format) }
					: undefined
			}
		/>
	)
})

export default NumberFlow
