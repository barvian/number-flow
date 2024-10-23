import { useStore } from '@nanostores/react'
import Component from './Component'
import { $diff, $number } from '../stores'

export default function () {
	const number = useStore($number)
	const diff = useStore($diff)
	return <Component value={number} diff={diff} />
}
