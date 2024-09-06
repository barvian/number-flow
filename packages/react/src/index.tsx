import * as React from 'react'
import _NumberFlow, {
	renderTemplateToString,
	type Value,
	type Locales,
	type Format
} from 'number-flow'

const useIsomorphicLayoutEffect =
	typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

function useConstant<T>(init: () => T) {
	const ref = React.useRef<T | null>(null)
	if (ref.current === null) ref.current = init()

	return ref.current
}

export default function NumberFlow({
	value,
	locales,
	format
}: {
	value: Value
	locales?: Locales
	format?: Format
}) {
	const ref = React.useRef<HTMLSpanElement>(null)
	const templateHTML = useConstant(() => renderTemplateToString(value))

	const flow = React.useRef<_NumberFlow>()
	useIsomorphicLayoutEffect(() => {
		if (!flow.current && ref.current) flow.current = new _NumberFlow(ref.current)
	}, [])
	useIsomorphicLayoutEffect(() => {
		flow.current?.update((flow) => {
			flow.value = value
			flow.format = format
			flow.locales = locales
		})
	}, [value, format, locales])

	return (
		<span ref={ref}>
			<template
				// @ts-expect-error non-standard Chrome API for backwards compatibility
				shadowroot="open"
				shadowrootmode="open"
				dangerouslySetInnerHTML={{ __html: templateHTML }}
			></template>
		</span>
	)
}
