import type NumberFlowLite from 'number-flow/lite'
import { getContext, setContext } from 'svelte'
import type { Readable } from 'svelte/store'

let groupKey = Symbol('group')

export type RegisterWithGroup = (el: Readable<NumberFlowLite | undefined>) => void

export type GroupContext = { register: RegisterWithGroup; willUpdate: () => void }

export function setGroupContext(ctx: GroupContext) {
	setContext(groupKey, ctx)
}

export function getGroupContext() {
	return getContext(groupKey) as GroupContext | undefined
}
