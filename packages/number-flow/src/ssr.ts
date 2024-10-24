import type { PartitionedParts } from './formatter'
import { charHeight, maskHeight, SlottedTag } from './styles'
import { BROWSER } from './util/env'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

export type RenderProps = { formatted: PartitionedParts['formatted']; willChange?: boolean }

// Could eventually use DSD e.g.
// `<template shadowroot="open" shadowrootmode="open">
export const render = ({ formatted, willChange }: RenderProps) =>
	`<${SlottedTag} style="font-kerning: none; display: inline-block; line-height: ${charHeight}; padding: ${maskHeight} 0;${willChange ? 'will-change: transform' : ''}">${formatted}</${SlottedTag}>`
