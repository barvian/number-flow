import { atom, computed } from 'nanostores'

export function cycledAtom<T>(...options: Array<T>) {
	const $index = atom(0)
	const $value = computed($index, (i) => options[i]!)
	return Object.assign($value, {
		cycle: () => $index.set(($index.get() + 1) % options.length)
	})
}
