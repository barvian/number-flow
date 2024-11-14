<script lang="ts" setup>
import type { NumberFlowLite } from 'number-flow'
import { key, type RegisterWithGroup } from './group'
import { provide, watch, type Ref, nextTick, onUnmounted } from 'vue'

const flows = new Set<Ref<NumberFlowLite | undefined>>()
let updating = false

const registerWithGroup: RegisterWithGroup = (el, parts) => {
	flows.add(el)

	watch(
		parts,
		async () => {
			if (updating) return
			updating = true
			flows.forEach(async (flow) => {
				if (!flow.value || !flow.value.created) return
				flow.value.willUpdate()
				await nextTick()
				// Optional in case the element was removed after tick:
				flow.value?.didUpdate()
			})
			await nextTick()
			updating = false
		}
		// { flush: 'pre' } // default
	)

	onUnmounted(() => {
		flows.delete(el)
	})
}

provide(key, registerWithGroup)
</script>
<template>
	<slot />
</template>
