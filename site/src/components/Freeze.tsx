import * as React from 'react'

export function Freeze({ frozen, children }: { frozen: boolean; children: React.ReactNode }) {
	const elementsRef = React.useRef(new Set<HTMLElement>())
	const fragmentRef: React.RefCallback<React.FragmentInstance> = (frag) => {
		if (!frag) return
		// Use a custom observer to store the child DOM nodes in a ref,
		// because FragmentInstance doesn't offer an API to do it directly.
		const observer = new ElementsObserver(elementsRef)

		frag.observeUsing(observer)
		return () => {
			frag?.unobserveUsing(observer)
		}
	}

	// An insertion effect is the earliest opportunity to undo Suspense's `display: none`
	React.useInsertionEffect(() => {
		if (!frozen) return
		elementsRef.current.forEach((element) => {
			element.style.display = ''
		})
	}, [frozen])

	return (
		<React.Fragment ref={fragmentRef}>
			<React.Suspense>
				{frozen && <Suspend />}
				{children}
			</React.Suspense>
		</React.Fragment>
	)
}

// A custom observer to store DOM nodes in a ref:
class ElementsObserver {
	constructor(private readonly elementsRef: React.RefObject<Set<HTMLElement>>) {}

	observe(element: HTMLElement) {
		this.elementsRef.current.add(element)
	}
	unobserve(element: HTMLElement) {
		this.elementsRef.current.delete(element)
	}
	disconnect() {
		this.elementsRef.current.clear()
	}
}

const infinitePromise = new Promise<never>(() => {})
function Suspend() {
	React.use(infinitePromise)
	return null
}
