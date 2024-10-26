'use client'

import * as React from 'react'
import NumberFlow from '@number-flow/react'

export default function Page() {
	const [value, setValue] = React.useState(123)
	return (
		<>
			<div>
				Text node <NumberFlow value={value} />
			</div>
			<button onClick={() => setValue(234)}>Change</button>
		</>
	)
}
