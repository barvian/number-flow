export type Rename<T, K extends keyof T, N extends string> = {
	[P in keyof T as P extends K ? N : P]: T[P]
}

// Utility type that requires exactly one key with value true
export type SingleTrueKey<K extends string | number | symbol> = {
	[P in K]: Record<P, true>
}[K]
