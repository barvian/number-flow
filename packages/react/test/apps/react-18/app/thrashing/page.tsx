'use client'

import * as React from 'react'
import NumberFlow, { type Format } from '@number-flow/react'

// Intentionally no <NumberFlowGroup>: updating any number of flows in the
// same update should batch reads/writes without one.
export default function Page() {
	const [value, setValue] = React.useState(42)
	const [format, setFormat] = React.useState<Format | undefined>(undefined)
	const [suffix, setSuffix] = React.useState<string | undefined>(undefined)

	const change = () => {
		setFormat({ style: 'currency', currency: 'USD' })
		setSuffix('/mo')
		setValue(1250.5)
	}

	React.useEffect(() => {
		// Exposed for the reflow test:
		;(window as unknown as { change: () => void }).change = change
	})

	return (
		<>
			<NumberFlow data-testid="flow1" value={value} format={format} suffix={suffix} />
			<NumberFlow data-testid="flow2" value={value} format={format} suffix={suffix} />
			<button onClick={change}>Change</button>
		</>
	)
}
