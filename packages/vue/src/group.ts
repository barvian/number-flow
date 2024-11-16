import type { NumberFlowLite, formatToData } from 'number-flow'
import type { InjectionKey, Ref, ComputedRef } from 'vue'

export type RegisterWithGroup = (
	el: Ref<NumberFlowLite | undefined>,
	parts: ComputedRef<ReturnType<typeof formatToData>>
) => void

export const key = Symbol() as InjectionKey<RegisterWithGroup | undefined>
