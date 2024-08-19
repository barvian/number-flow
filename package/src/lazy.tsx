import * as React from 'react'
import InternalMotionNumber, { type MotionNumberProps } from './MotionNumber'
import { m } from 'framer-motion'
export * from './MotionNumber'

const MotionNumber = React.forwardRef<HTMLSpanElement, MotionNumberProps>(
	function MotionNumber(props, ref) {
		return <InternalMotionNumber ref={ref} motion={m} {...props} />
	}
)

export default MotionNumber
