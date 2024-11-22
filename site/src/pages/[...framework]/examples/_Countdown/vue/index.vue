<script setup lang="ts">
import Component from './Component.vue'
import { useStore } from '@nanostores/vue'
import { $seconds } from '../stores'

const seconds = useStore($seconds)
</script>

<template>
	<Component :seconds />
</template>
