<script setup lang="ts">
import Comp from './Component.vue'
import { useStore } from '@nanostores/vue'
import { $number, $diff } from '../stores'

const number = useStore($number)
const diff = useStore($diff)
</script>

<template>
	<Comp :value="number" :diff="diff" />
</template>
