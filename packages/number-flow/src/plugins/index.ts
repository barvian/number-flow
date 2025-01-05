import type { NumberFlowLite, Digit } from '../lite'
import type { Data } from '../formatter'

export type Plugin = {
	onUpdate?(data: Data, prev: Data, context: NumberFlowLite): void
	getDelta?(value: number, prev: number, context: Digit): number | void
}

export { continuous } from './continuous'
