import Example from './Component'
import * as React from 'react'

export default function Slider() {
	const [value, setValue] = React.useState(50)
	return (
		<Example
			value={[value]}
			onValueChange={([value]) => value != null && setValue(value)}
			min={0}
			max={100}
			step={1}
		/>
	)
}
