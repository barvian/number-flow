import { BROWSER } from 'esm-env'
import { formatToParts, type Format, type Value } from './formatter'
import { maskHeight } from './styles'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

const renderDSD = (formatted: string) =>
	// shadowroot= for older Chrome, shadowrootmode = standard
	`<template shadowroot="open" shadowrootmode="open">
${formatted}
</template>`

const render = (formatted: string) =>
	`<span style="font-kerning: none; display: inline-block; padding: ${maskHeight} 0;">${formatted}</span>`

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
