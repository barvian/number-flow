import type NumberFlowLite from 'number-flow/lite'
import type { formatToData } from 'number-flow/lite'
import type { InjectionKey, Ref, ComputedRef } from 'vue'

export type RegisterWithGroup = (
	el: Ref<NumberFlowLite | undefined>,
	parts: ComputedRef<ReturnType<typeof formatToData>>
) => void

export const key = Symbol() as InjectionKey<RegisterWithGroup | undefined>
