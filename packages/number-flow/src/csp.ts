import runtimeStyles from './styles'
import { styles as ssrStyles, fallbackStyles as ssrFallbackStyles } from './ssr'

export const styles = [ssrStyles, ssrFallbackStyles, runtimeStyles] as const
