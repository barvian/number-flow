import { useStore } from '@nanostores/react'
import Component from './Component'
import { $value } from '../stores'

export default function () {
	const value = useStore($value)
	return <Component value={value} />
}
