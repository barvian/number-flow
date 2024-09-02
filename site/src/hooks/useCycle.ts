import * as React from 'react'

export default function useCycle<T>(options: Array<T>, defaultValue?: T) {
	const [index, setIndex] = React.useState(defaultValue ? undefined : 0)
	const next = () => setIndex((i) => ((i ?? -1) + 1) % options.length)

	return [index == null && defaultValue ? defaultValue : options[index ?? 0]!, next] as const
}
