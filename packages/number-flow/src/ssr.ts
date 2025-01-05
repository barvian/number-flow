import type { Data, KeyedNumberPart } from './formatter'
import { css, html } from './util/string'
import { charHeight, halfMaskHeight, maskHeight } from './styles'
import { BROWSER } from 'esm-env'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

const styles = css`
	:host {
		display: inline-block;
		direction: ltr;
		white-space: nowrap;
		line-height: ${charHeight} !important;
	}

	span {
		display: inline-block;
	}

	:host([data-will-change]) span {
		will-change: transform;
	}

	.number,
	.digit {
		padding: ${halfMaskHeight} 0;
	}

	.symbol {
		white-space: pre; /* some symbols are spaces or thin spaces */
	}
`

const renderPart = (part: KeyedNumberPart, digitChars: Record<number, string>) => {
	if (part.type === 'integer' || part.type === 'fraction') {
		return `<span class="digit" part="digit ${part.type}-digit">${digitChars[part.value]!}</span>`
	}
	return `<span class="symbol" part="symbol ${part.type}">${part.value}</span>`
}

const renderSection = (
	section: KeyedNumberPart[],
	part: string,
	digitChars: Record<number, string>
) =>
	`<span part="${part}">${section.reduce((str, p) => str + renderPart(p, digitChars), '')}</span>`

export const renderInnerHTML = (data: Data) =>
	// shadowroot="open" non-standard attribute for old Chrome:
	html`<template shadowroot="open" shadowrootmode="open"
			><style>
				${styles}</style
			>${renderSection(data.pre, 'left', data.digitChars)}<span part="number" class="number"
				>${renderSection(data.integer, 'integer', data.digitChars)}${renderSection(
					data.fraction,
					'fraction',
					data.digitChars
				)}</span
			>${renderSection(data.post, 'right', data.digitChars)}</template
		><span
			style="font-kerning: none; display: inline-block; line-height: ${charHeight} !important; padding: ${maskHeight} 0;"
			>${data.valueAsString}</span
		>` // ^ fallback for browsers that don't support DSD
