import type { Data, KeyedNumberPart } from './formatter'
import { css, html } from './util/string'
import { halfMaskHeight, maskHeight } from './styles'
import { BROWSER } from 'esm-env'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

export const styles = css`
	:host {
		display: inline-block;
		direction: ltr;
		white-space: nowrap;
		line-height: 1;
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

export const renderFallbackStyles = (elementSuffix = '') => css`
	:where(number-flow${elementSuffix}) {
		line-height: 1;
	}

	number-flow${elementSuffix} > span {
		font-kerning: none;
		display: inline-block;
		padding: ${maskHeight} 0;
	}
`

export const renderInnerHTML = (
	data: Data,
	{ nonce, elementSuffix }: { nonce?: string; elementSuffix?: string } = {}
) =>
	// shadowroot="open" non-standard attribute for old Chrome:
	html`<template shadowroot="open" shadowrootmode="open"
			><style${nonce ? ` nonce="${nonce}"` : ''}>${styles}</style
			><span role="img" aria-label="${data.valueAsString}"
				>${renderSection(data.pre, 'left')}<span part="number" class="number"
					>${renderSection(data.integer, 'integer')}${renderSection(data.fraction, 'fraction')}</span
				>${renderSection(data.post, 'right')}</span
			></template
		><style${nonce ? ` nonce="${nonce}"` : ''}>${renderFallbackStyles(elementSuffix)}</style
		><span>${data.valueAsString}</span>`
