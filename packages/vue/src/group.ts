import type { NumberFlowLite, partitionParts } from 'number-flow'
import type { InjectionKey, Ref, ComputedRef, MaybeRefOrGetter } from 'vue'

export type RegisterWithGroup = (
	el: Ref<NumberFlowLite | undefined>,
	parts: ComputedRef<ReturnType<typeof partitionParts>>
) => void

export const key = Symbol() as InjectionKey<RegisterWithGroup | undefined>
