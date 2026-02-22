import runtimeStyles from './styles'
import { styles as ssrStyles, renderFallbackStyles } from './ssr'

export const buildStyles = (elementSuffix?: string) =>
	[ssrStyles, renderFallbackStyles(elementSuffix), runtimeStyles] as const
