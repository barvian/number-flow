import { isTransitionBeforePreparationEvent } from 'astro:transitions/client'
import { atom } from 'nanostores'
import type { Framework } from '../lib/framework'

export const urlAtom = atom<URL | Location | undefined>(
	import.meta.env.SSR ? undefined : window.location
)
if (!import.meta.env.SSR)
	document.addEventListener('astro:before-preparation', (event) => {
		if (!isTransitionBeforePreparationEvent(event)) return
		urlAtom.set(event.to)
	})

export const pageFrameworkAtom = atom<Framework | null>(
	import.meta.env.SSR ? null : (document.documentElement.dataset.framework as Framework)
)
