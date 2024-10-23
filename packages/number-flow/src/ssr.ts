import { BROWSER } from './util/env'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

// Could eventually use DSD e.g.
// `<template shadowroot="open" shadowrootmode="open">
