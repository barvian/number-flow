import { easeOut } from 'framer-motion'
import Demo, { type DemoProps } from '../components/Demo'
import useCycle from '../hooks/useCycle'
// import MotionNumber from 'motion-number'

const NUMBERS = [12398.4, -543.2, 3243.6]

export default function DemoIndicator({ children, ...rest }: DemoProps) {
	const [value, cycleValue] = useCycle(NUMBERS)

	return (
		// <Demo {...rest} code={children} onClick={cycleValue}>
		{
			/* <MotionNumber
				value={value}
				className="~text-3xl/5xl font-medium"
				transition={{
					opacity: { duration: 0.7, ease: easeOut, times: [0, 0.3] },
					y: { type: 'spring', duration: 0.7, bounce: 0.25 },
					layout: { type: 'spring', duration: 0.7, bounce: 0 }
				}}
			/> */
		}
		// </Demo>
	)
}
