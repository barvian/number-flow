import { formatToParts, type Format, type Value } from './formatter'

export const ServerSafeHTMLElement =
	typeof window === 'undefined' || typeof HTMLElement === 'undefined'
		? (class {} as unknown as typeof HTMLElement)
		: HTMLElement

export const renderInnerHTML = (value: Value, locales?: Intl.LocalesArgument, format?: Format) => {
	const { formatted } = formatToParts(value, locales, format)
	return `<template
        shadowroot="open"
        shadowrootmode="open"
    >
    <style>:host { display: inline-block; }</style>
    ${formatted}
    </template>`
}
