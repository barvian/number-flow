import { atom, onMount, type ReadableAtom } from 'nanostores'
import { hydratable } from '@/lib/stores'

export const $inView = atom(false)

function countdownable(
	initialValue: number,
	active: ReadableAtom<boolean>,
	rate = 1,
	everyMs = 1000
) {
	const state = atom(initialValue)

	onMount(state, () => {
		let timeout: NodeJS.Timeout | null = null
		const unsubscribe = active.subscribe((active) => {
			if (timeout != null) clearInterval(timeout)
			if (!active) return
			timeout = setInterval(() => {
				state.set(state.get() - rate)
			}, everyMs)
		})
		return () => {
			if (timeout != null) clearInterval(timeout)
			unsubscribe()
		}
	})

	return state
}

export const $seconds = hydratable(countdownable(3600, $inView))
