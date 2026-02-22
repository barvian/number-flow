import type { Data, KeyedNumberPart } from './formatter'
import { css, html } from './util/string'
import { charHeight, halfMaskHeight, maskHeight } from './styles'
import { BROWSER } from 'esm-env'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

export const styles = css`
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

const renderPart = (part: KeyedNumberPart) =>
	`<span class="${part.type === 'integer' || part.type === 'fraction' ? 'digit' : 'symbol'}" part="${part.type === 'integer' || part.type === 'fraction' ? `digit ${part.type}-digit` : `symbol ${part.type}`}">${part.value}</span>`

const renderSection = (section: KeyedNumberPart[], part: string) =>
	`<span part="${part}">${section.reduce((str, p) => str + renderPart(p), '')}</span>`

export const fallbackStyles = css`
	[data-number-flow-fallback] {
		font-kerning: none;
		display: inline-block;
		line-height: ${charHeight} !important;
		padding: ${maskHeight} 0;
	}
`

export const renderInnerHTML = (data: Data, { nonce }: { nonce?: string } = {}) =>
	// shadowroot="open" non-standard attribute for old Chrome:
	html`<template shadowroot="open" shadowrootmode="open"
			><style${nonce ? ` nonce="${nonce}"` : ''}>${styles}</style
			><span role="img" aria-label="${data.valueAsString}"
				>${renderSection(data.pre, 'left')}<span part="number" class="number"
					>${renderSection(data.integer, 'integer')}${renderSection(data.fraction, 'fraction')}</span
				>${renderSection(data.post, 'right')}</span
			></template
		><style${nonce ? ` nonce="${nonce}"` : ''}>${fallbackStyles}</style
		><span data-number-flow-fallback>${data.valueAsString}</span>`
