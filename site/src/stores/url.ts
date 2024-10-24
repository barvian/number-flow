import { isTransitionBeforePreparationEvent } from 'astro:transitions/client'
import { atom } from 'nanostores'
import type { Framework } from '../lib/framework'

export const $url = atom<URL | Location | undefined>(
	// Set in middleware:
	import.meta.env.SSR ? undefined : window.location
)
if (!import.meta.env.SSR)
	document.addEventListener('astro:before-preparation', (event) => {
		if (!isTransitionBeforePreparationEvent(event)) return
		$url.set(event.to)
	})

export const $pageFramework = atom<Framework | null>(
	// Set in middleware:
	import.meta.env.SSR ? null : (document.documentElement.dataset.framework as Framework)
)
