<script lang="ts">
	import NumberFlow from '$lib/index.js'

	let value = 123
</script>

<div>
	Text node
	<NumberFlow {value} />
</div>
<button on:click={() => (value = 234)}>Change</button>
