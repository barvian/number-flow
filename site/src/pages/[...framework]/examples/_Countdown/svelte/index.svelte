<script lang="ts">
	import Component from './Component.svelte'
	import { $seconds as seconds } from '../stores'
</script>

<Component seconds={$seconds} />
