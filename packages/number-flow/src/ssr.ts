import { formatToParts, type Format, type Value } from './formatter'

export const ServerSafeHTMLElement =
	typeof window === 'undefined' || typeof HTMLElement === 'undefined'
		? (class {} as unknown as typeof HTMLElement) // for types
		: HTMLElement

export const renderInnerHTML = (value: Value, locales?: Intl.LocalesArgument, format?: Format) => {
	const { formatted } = formatToParts(value, locales, format)
	// shadowroot= for older Chrome, shadowrootmode = standard
	return `<template
        shadowroot="open"
        shadowrootmode="open"
    >
    <style>:host { display: inline-flex; }</style>
    ${formatted}
    </template>`
}
