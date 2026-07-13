<script lang="ts">
	import type NumberFlowLite from 'number-flow/lite'
	import { type Readable, get } from 'svelte/store'
	import { onDestroy } from 'svelte'
	import { type RegisterWithGroup, setGroupContext } from './group.js'

	const flows = new Set<Readable<NumberFlowLite | undefined>>()

	const registerWithGroup: RegisterWithGroup = (el) => {
		flows.add(el)

		onDestroy(() => {
			flows.delete(el)
		})
	}

	setGroupContext({
		register: registerWithGroup,
		// When any flow's data changes, transition all of them together. The
		// shared frame dedupes and batches every flow's reads and writes:
		willUpdate() {
			flows.forEach((flow) => {
				get(flow)?.willUpdate()
			})
		}
	})
</script>

<slot />
