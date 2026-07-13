<script lang="ts" setup>
import type NumberFlowLite from 'number-flow/lite'
import { key, type RegisterWithGroup } from './group'
import { provide, watch, type Ref, onUnmounted } from 'vue'

const flows = new Set<Ref<NumberFlowLite | undefined>>()

const registerWithGroup: RegisterWithGroup = (el, parts) => {
	flows.add(el)

	// When any flow's data changes, transition all of them together. The
	// shared frame dedupes and batches every flow's reads and writes:
	watch(parts, () => {
		flows.forEach((flow) => {
			flow.value?.willUpdate()
		})
	})

	onUnmounted(() => {
		flows.delete(el)
	})
}

provide(key, registerWithGroup)
</script>
<template>
	<slot />
</template>
