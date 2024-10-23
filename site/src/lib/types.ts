export type Rename<T, K extends keyof T, N extends string> = {
	[P in keyof T as P extends K ? N : P]: T[P]
}
