import { atom, map, onMount, type ReadableAtom } from 'nanostores'
import { hydratable } from '@/lib/stores'

export const $inView = atom(false)

interface CounterState {
	count: number
	hasIncremented: boolean
}

function countable(
	initialValue: number,
	active: ReadableAtom<boolean>,
	min: number,
	max: number,
	rate = 1
) {
	const state = map<CounterState>({
		count: initialValue,
		hasIncremented: false
	})

	onMount(state, () => {
		let timeout: NodeJS.Timeout | null = null
		const unsubscribe = active.subscribe((active) => {
			if (timeout != null) clearTimeout(timeout)
			if (!active) return
			const randomlyIncrease = (delay: number) => {
				timeout = setTimeout(() => {
					state.setKey('count', state.get().count + randomBetween(min, max) * rate)
					randomlyIncrease(3500)
				}, delay)
			}
			randomlyIncrease(1500)
		})
		return () => {
			if (timeout != null) clearTimeout(timeout)
			unsubscribe()
		}
	})

	return Object.assign(state, {
		toggle: () => {
			const s = state.get()
			state.set({
				count: s.hasIncremented ? s.count - 1 : s.count + 1,
				hasIncremented: !s.hasIncremented
			})
		}
	})
}

// Generate a random number between two numbers:
function randomBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

export const $reposts = hydratable(countable(2, $inView, 0, 2))
export const $likes = hydratable(countable(50, $inView, 0, 3, 5))
export const $bookmarks = hydratable(countable(40, $inView, 0, 3, 3))
export const $views = hydratable(countable(995, $inView, 1, 3, 50))
