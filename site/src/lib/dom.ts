// Used for vanilla JS examples:
export const onReady = (cb: () => () => void) => {
	document.addEventListener('astro:page-load', () => {
		// Lazy try/catch to prevent errors on inapplicable pages:
		try {
			const destroy = cb()
			// Use after-preparation because our hydratable nanostores use before-swap:
			document.addEventListener('astro:after-preparation', destroy, {
				once: true
			})
		} catch {}
	})
}
