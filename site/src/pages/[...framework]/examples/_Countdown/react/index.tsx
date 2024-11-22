import Component from './Component'
import { useStore } from '@nanostores/react'
import { $seconds } from '../stores'

export default function () {
	const seconds = useStore($seconds)

	return <Component seconds={seconds} />
}
