import { useLinear } from '.'
import { type Transition } from 'framer-motion'

export const useDefaultTransformTransition = () =>
	useLinear<Transition>(
		{
			type: 'spring',
			duration: 0.9,
			bounce: 0
		},
		{ duration: 900, easing: [0.32, 0.72, 0, 1] }
	)
