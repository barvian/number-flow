<script lang="ts">
	import type { NumberFlowLite } from 'number-flow'
	import { type Readable, get } from 'svelte/store'
	import { beforeUpdate, onDestroy, tick } from 'svelte'
	import { type RegisterWithGroup, setGroupContext } from './group.js'

	const flows = new Set<Readable<NumberFlowLite | undefined>>()
	let updating = false

	const registerWithGroup: RegisterWithGroup = (el) => {
		let mounted = false
		flows.add(el)

		beforeUpdate(async () => {
			if (!get(el)) return
			if (!mounted) {
				mounted = true
				return
			}
			if (updating) return
			updating = true
			flows.forEach((flow) => {
				get(flow)?.willUpdate()
			})
			await tick()
			flows.forEach((flow) => {
				get(flow)?.didUpdate()
			})
			updating = false
		})

		onDestroy(() => {
			flows.delete(el)
		})
	}

	setGroupContext({ register: registerWithGroup })
</script>

<slot />
