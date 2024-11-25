'use client'

import * as React from 'react'
import { useCanAnimate } from '@number-flow/react'

export default function Page() {
	const canAnimate = useCanAnimate()
	const disrespectMotionPreference = useCanAnimate({ respectMotionPreference: false })
	return (
		<div>
			<p data-testid="default">{String(canAnimate)}</p>
			<p data-testid="disrespect-motion-preference">{String(disrespectMotionPreference)}</p>
		</div>
	)
}
