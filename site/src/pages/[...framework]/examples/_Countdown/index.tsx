import Demo, { type DemoProps } from '@/components/Demo'
import { $inView, $seconds } from './stores'

export default function Activity(props: DemoProps) {
	return <Demo {...props} onIntersect={({ isIntersecting }) => $inView.set(isIntersecting)} />
}
