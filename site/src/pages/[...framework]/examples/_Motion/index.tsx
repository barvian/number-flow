import Demo, { type DemoProps } from '@/components/Demo'
import { $value } from './stores'

export default function Group(props: DemoProps) {
	return <Demo {...props} onClick={() => $value.cycle()} />
}
