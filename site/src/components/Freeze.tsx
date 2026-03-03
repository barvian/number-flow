import * as React from 'react'

type FreezeProps = {
	frozen: boolean
	children: React.ReactNode
}

type FragmentObserver = {
	observe(element: HTMLElement): void
	unobserve(element: HTMLElement): void
	disconnect(): void
}

type ObservableFragmentInstance = React.FragmentInstance & {
	observeUsing(observer: FragmentObserver): void
	unobserveUsing(observer: FragmentObserver): void
}

class ElementsObserver implements FragmentObserver {
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

export default function Freeze({ frozen, children }: FreezeProps) {
	const elementsRef = React.useRef(new Set<HTMLElement>())

	const fragmentRef = React.useCallback((fragment: React.FragmentInstance | null) => {
		if (!fragment) return

		const observer = new ElementsObserver(elementsRef)
		const observableFragment = fragment as ObservableFragmentInstance
		observableFragment.observeUsing(observer)

		return () => {
			observableFragment.unobserveUsing(observer)
			observer.disconnect()
		}
	}, [])

	// Undo Suspense's `display: none` so the exiting subtree stays visible while frozen.
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
