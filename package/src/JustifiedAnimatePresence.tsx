import * as React from 'react'
import { AnimatePresence, type AnimatePresenceProps } from 'framer-motion'
import PopChildRight from './PopChildRight'
import type { Justify } from '.'

const getChildKey = (child: React.ReactElement) => child.key ?? ''

export default function JustifiedAnimatePresence({
	justify = 'left',
	children: _children,
	mode,
	...rest
}: AnimatePresenceProps & {
	justify?: Justify
	children: React.ReactElement | React.ReactElement[]
}) {
	const popRight = mode === 'popLayout' && justify === 'right'
	const children = Array.isArray(_children) ? _children : [_children]
	return (
		<AnimatePresence {...rest} mode={popRight ? 'sync' : mode}>
			{popRight
				? children.map((child) => <PopChildRight key={getChildKey(child)}>{child}</PopChildRight>)
				: children}
		</AnimatePresence>
	)
}
