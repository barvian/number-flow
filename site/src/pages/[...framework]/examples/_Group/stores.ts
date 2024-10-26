import { cyclable, hydratable } from '@/lib/stores'

export const $number = hydratable(cyclable(124.23, 41.75, 2125.95))
export const $diff = hydratable(cyclable(0.0564, -0.3912, 0.0029))
