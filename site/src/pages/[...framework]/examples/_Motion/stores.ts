import { cyclable, hydratable } from '@/lib/stores'

export const $value = hydratable(cyclable(0.0564, -0.3912, 0.0029))
