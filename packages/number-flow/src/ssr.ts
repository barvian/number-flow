import { BROWSER } from 'esm-env'

export const ServerSafeHTMLElement = BROWSER
	? HTMLElement
	: (class {} as unknown as typeof HTMLElement) // for types

// Could eventually use DSD i.e.
// `<template shadowroot="open" shadowrootmode="open">
