import Demo, { type DemoProps } from '@/components/Demo'
import { $number, $diff } from './stores'

export default function Group(props: DemoProps) {
	function onClick() {
		$number.cycle()
		$diff.cycle()
	}

	return <Demo {...props} onClick={onClick} />
}
