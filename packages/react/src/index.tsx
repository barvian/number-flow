import * as React from 'react'
import _NumberFlow, { type Value, type Format } from 'number-flow'
export type * from 'number-flow'

function useConstant<T>(init: () => T) {
	const ref = React.useRef<T | null>(null)
	if (ref.current === null) ref.current = init()

	return ref.current
}

const NumberFlow = React.forwardRef<
	_NumberFlow,
	React.HTMLAttributes<_NumberFlow> & {
		value: Value
		locales?: Intl.LocalesArgument
		format?: Format
	}
>(function NumberFlow({ value, className, locales, format, ...rest }, _ref) {
	const ref = React.useRef<_NumberFlow>(null)
	React.useImperativeHandle(_ref, () => ref.current!, [])

	React.useInsertionEffect(() => {
		if (ref.current == null) return
		ref.current.value = [value, locales, format]
	}, [value, locales, format])

	const templateHTML = typeof window === 'undefined' ? 'hi' : null

	return (
		// @ts-expect-error
		<number-flow ref={ref} class={className} {...rest} suppressHydrationWarning>
			{templateHTML && (
				<template
					// @ts-expect-error non-standard Chrome API for backwards compatibility
					shadowroot="open"
					shadowrootmode="open"
					dangerouslySetInnerHTML={{ __html: templateHTML }}
				></template>
			)}
			{/* @ts-expect-error */}
		</number-flow>
	)
})

export default NumberFlow
