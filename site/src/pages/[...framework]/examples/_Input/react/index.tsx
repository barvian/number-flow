import Component from './Component'
import * as React from 'react'

export default function Input() {
	const [value, setValue] = React.useState(0)
	return <Component value={value} min={0} max={99} onChange={setValue} />
}
