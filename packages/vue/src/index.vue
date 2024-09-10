<script lang="ts">
export type * from 'number-flow'
</script>
<script lang="ts" setup>
import _, { type Value, type Format, renderInnerHTML } from 'number-flow'

const { value, locales, format } = defineProps<{
	value: Value
	locales?: Intl.LocalesArgument
	format?: Format
}>()

const html = typeof window === 'undefined' ? renderInnerHTML(value, locales, format) : undefined
</script>

<number-flow :value="[value, locales, format]" data-allow-mismatch v-html="html" />
