import {
	atom,
	computed,
	onStart,
	type PreinitializedWritableAtom,
	type ReadableAtom
} from 'nanostores'

export const isCyclableAtom = Symbol()

export type CyclableAtom<T> = ReadableAtom<T> & {
	cycle: () => void
	reset: () => void
	[isCyclableAtom]: true
}

export function cyclable<T>(...options: Array<T>): CyclableAtom<T> {
	const $index = atom(0)
	const $value = computed($index, (i) => options[i]!)
	return Object.assign($value, {
		cycle: () => $index.set(($index.get() + 1) % options.length),
		reset: () => $index.set(0),
		[isCyclableAtom]: true
	} as const)
}

export function hydratable<T, A extends CyclableAtom<T> | PreinitializedWritableAtom<T>>(
	$atom: A
): A {
	const initial = $atom.get()
	onStart($atom, () => {
		const beforeSwap = () => {
			if (isCyclableAtom in $atom) $atom.reset()
			else $atom.set(initial)
		}
		typeof document !== 'undefined' && document.addEventListener('astro:before-swap', beforeSwap)
		return () => {
			document.removeEventListener('astro:before-swap', beforeSwap)
		}
	})
	return $atom
}
