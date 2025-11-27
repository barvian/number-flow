<script lang="ts">
	import type NumberFlowLite from 'number-flow/lite'
	import { type Readable, get } from 'svelte/store'
	import { onDestroy, tick, type Snippet } from 'svelte'
	import { type RegisterWithGroup, setGroupContext } from './group.js'

	const { children }: { children: Snippet } = $props()
	const flows = new Set<Readable<NumberFlowLite | undefined>>()
	let updating = false

	const registerWithGroup: RegisterWithGroup = (el) => {
		flows.add(el)

		// Migration to $effect for Svelte 5 - using functional approach to pass await
		$effect(() => {
			const updateFlows = async () => {
				if (updating) return
				updating = true
				for (const flow of flows) {
					{
						const f = get(flow)
						if (!f || !f.created) continue
						f.willUpdate()
					}
					await tick()
					// Optional in case the element was removed after tick:
					get(flow)?.didUpdate()
				}
				await tick()
				updating = false
			}

			updateFlows()
		})

		onDestroy(() => {
			flows.delete(el)
		})
	}

	setGroupContext({ register: registerWithGroup })
</script>

{@render children()}
