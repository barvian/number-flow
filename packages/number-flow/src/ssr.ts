import { formatToParts, type Format, type Value } from './formatter'

export const ServerSafeHTMLElement =
	typeof window === 'undefined' || typeof HTMLElement === 'undefined'
		? (class {} as unknown as typeof HTMLElement) // for types
		: HTMLElement

const renderDSD = (formatted: string) =>
	// shadowroot= for older Chrome, shadowrootmode = standard
	`<template shadowroot="open" shadowrootmode="open">
${formatted}
</template>`

const render = (formatted: string) => `${formatted}`

export const renderInnerHTML = (
	value: Value,
	{
		locales,
		format,
		dsd
	}: {
		locales?: Intl.LocalesArgument
		format?: Format
		dsd?: boolean
	}
) => {
	const { formatted } = formatToParts(value, locales, format)

	return dsd ? renderDSD(formatted) : render(formatted)
}
