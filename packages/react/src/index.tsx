import * as React from 'react'
import _NumberFlow, { type Value, type Format } from 'number-flow'
export type * from 'number-flow'

function useConstant<T>(init: () => T) {
	const ref = React.useRef<T | null>(null)
	if (ref.current === null) ref.current = init()

	return ref.current
}

const NumberFlow = React.forwardRef<
	typeof _NumberFlow,
	React.HTMLAttributes<typeof _NumberFlow> & {
		value: Value
		locales?: Intl.LocalesArgument
		format?: Format
	}
>(function NumberFlow({ value, locales, format, ...rest }, ref) {
	const templateHTML = 'hi'

	return (
		// @ts-expect-error
		<number-flow ref={ref} {...rest}>
			<template
				// @ts-expect-error non-standard Chrome API for backwards compatibility
				shadowroot="open"
				shadowrootmode="open"
				dangerouslySetInnerHTML={{ __html: templateHTML }}
			></template>
			{/* @ts-expect-error */}
		</number-flow>
	)
})

export default NumberFlow
