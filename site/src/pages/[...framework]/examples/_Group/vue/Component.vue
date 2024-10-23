<script setup lang="ts">
const { value, diff } = defineProps<{
	value: number
	diff: number
}>()
</script>

<template>
	{{ value }}
	{{ diff }}
</template>
