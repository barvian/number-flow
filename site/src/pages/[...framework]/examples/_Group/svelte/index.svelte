<script lang="ts">
	import Component from './Component.svelte'
	import { $number as number, $diff as diff } from '../stores'
</script>

<Component value={$number} diff={$diff} />
