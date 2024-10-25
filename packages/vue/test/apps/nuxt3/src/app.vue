<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { ref } from 'vue'

const value = ref(123)
</script>
<template>
	<div>
		Text node
		<NumberFlow :value />
	</div>
	<button @click="value = 234">Change</button>
</template>
