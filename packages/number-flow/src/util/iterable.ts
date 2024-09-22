export function forEach<T>(
	arr: T[],
	fn: (item: T, index: number) => void,
	{ reverse = false } = {}
) {
	const len = arr.length
	for (let i = reverse ? len - 1 : 0; reverse ? i >= 0 : i < len; reverse ? i-- : i++) {
		fn(arr[i]!, i)
	}
}
