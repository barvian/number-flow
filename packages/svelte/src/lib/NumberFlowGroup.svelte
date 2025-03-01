<script lang="ts">
	import type NumberFlowLite from 'number-flow/lite'
	import { type Readable, get } from 'svelte/store'
	import { beforeUpdate, onDestroy, tick } from 'svelte'
	import { type RegisterWithGroup, setGroupContext } from './group.js'

	const flows = new Set<Readable<NumberFlowLite | undefined>>()
	let updating = false

	const registerWithGroup: RegisterWithGroup = (el) => {
		flows.add(el)

		beforeUpdate(async () => {
			if (updating) return
			updating = true
			flows.forEach(async (flow) => {
				{
					const f = get(flow)
					if (!f || !f.created) return
					f.willUpdate()
				}
				await tick()
				// Optional in case the element was removed after tick:
				get(flow)?.didUpdate()
			})
			await tick()
			updating = false
		})

		onDestroy(() => {
			flows.delete(el)
		})
	}

	setGroupContext({ register: registerWithGroup })
</script>

<slot />
