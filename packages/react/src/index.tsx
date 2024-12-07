'use client'

import * as React from 'react'
import {
	type Value,
	type Format,
	type Props,
	renderInnerHTML,
	formatToData,
	type Data,
	NumberFlowLite as NumberFlowElement,
	prefersReducedMotion,
	canAnimate as _canAnimate,
	define
} from 'number-flow'
import { BROWSER } from 'esm-env'
export type { Value, Format, Trend, NumberPartType } from 'number-flow'
export { NumberFlowElement }

define('number-flow-react', NumberFlowElement)

// We need a class component to use getSnapshotBeforeUpdate:
type SnapshotterProps = {
	childRef: React.RefObject<NumberFlowElement | undefined>
	group?: GroupContext
	isolate?: boolean
	children: React.ReactNode
	data: Data
}
type SnapshotterState = {}
type SnapshotterSnapshot = (() => void) | null // React doesn't like undefined
class Snapshotter extends React.Component<SnapshotterProps, SnapshotterState, SnapshotterSnapshot> {
	override getSnapshotBeforeUpdate(prevProps: Readonly<SnapshotterProps>) {
		// Data is changing, so we need to update:
		if (prevProps.data !== this.props.data) {
			if (this.props.group) {
				this.props.group.willUpdate()
				return () => this.props.group?.didUpdate()
			}
			if (!this.props.isolate) {
				this.props.childRef.current?.willUpdate()
				return () => this.props.childRef.current?.didUpdate()
			}
		}
		return null
	}

	override componentDidUpdate(
		_: Readonly<SnapshotterProps>,
		__: SnapshotterState,
		didUpdate: SnapshotterSnapshot
	) {
		didUpdate?.()
	}

	override render() {
		return this.props.children
	}
}

export type NumberFlowProps = React.HTMLAttributes<NumberFlowElement> &
	Partial<Props> & {
		value: Value
		locales?: Intl.LocalesArgument
		format?: Format
		prefix?: string
		suffix?: string
		isolate?: boolean
		willChange?: boolean
		onAnimationsStart?: (e: CustomEvent<undefined>) => void
		onAnimationsFinish?: (e: CustomEvent<undefined>) => void
		ref?: React.Ref<NumberFlowElement>
	}

function NumberFlow({
	value,
	locales,
	format,
	prefix,
	suffix,
	isolate,
	className,
	willChange,
	onAnimationsStart,
	onAnimationsFinish,
	ref: _ref,
	...props
}: NumberFlowProps) {
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const ref = React.useRef<NumberFlowElement>(undefined)
	const group = React.useContext(NumberFlowGroupContext)
	group?.useRegister(ref)

	// Probably superfluous but they could be passing in a cached object:
	const localesString = React.useMemo(() => (locales ? JSON.stringify(locales) : ''), [locales])
	const formatString = React.useMemo(() => (format ? JSON.stringify(format) : ''), [format])

	// You're supposed to cache these between uses:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
	const formatter = React.useMemo(
		() => new Intl.NumberFormat(locales, format),
		[localesString, formatString]
	)
	const data = React.useMemo(
		() => formatToData(value, formatter, prefix, suffix),
		[value, formatter, prefix, suffix]
	)

	return (
		<Snapshotter isolate={isolate} group={group} data={data} childRef={ref}>
			{/* @ts-expect-error missing types */}
			<number-flow-react
				ref={ref}
				data-will-change={willChange ? '' : undefined}
				// Have to rename these:
				class={className}
				onanimationsstart={onAnimationsStart}
				onanimationsfinish={onAnimationsFinish}
				// Aria-label should be overrideable, but not role=img
				aria-label={data.valueAsString}
				// Have to filter out undefineds before merging with defaultProps:
				{...Object.fromEntries(
					Object.entries(props).map(([k, v]) =>
						// @ts-expect-error
						[k, v ?? NumberFlowElement.defaultProps[k]]
					)
				)}
				role="img"
				dangerouslySetInnerHTML={{ __html: BROWSER ? '' : renderInnerHTML(data) }}
				suppressHydrationWarning
				// Make sure data is set last so everything else is updated:
				data={data}
			/>
		</Snapshotter>
	)
}

export default NumberFlow

// NumberFlowGroup
// ---

type GroupContext = {
	useRegister: (ref: React.RefObject<NumberFlowElement | undefined>) => void
	willUpdate: () => void
	didUpdate: () => void
}

const NumberFlowGroupContext = React.createContext<GroupContext | undefined>(undefined)

export function NumberFlowGroup({ children }: { children: React.ReactNode }) {
	const flows = React.useRef(new Set<React.RefObject<NumberFlowElement | undefined>>())
	const updating = React.useRef(false)
	const pending = React.useRef(new WeakMap<NumberFlowElement, boolean>())
	const value = React.useMemo<GroupContext>(
		() => ({
			useRegister(ref) {
				React.useEffect(() => {
					flows.current.add(ref)
					return () => {
						flows.current.delete(ref)
					}
				}, [])
			},
			willUpdate() {
				if (updating.current) return
				updating.current = true
				flows.current.forEach((ref) => {
					const f = ref.current
					if (!f || !f.created) return
					f.willUpdate()
					pending.current.set(f, true)
				})
			},
			didUpdate() {
				flows.current.forEach((ref) => {
					const f = ref.current
					if (!f || !pending.current.get(f)) return
					f.didUpdate()
					pending.current.delete(f)
				})
				updating.current = false
			}
		}),
		[]
	)

	return <NumberFlowGroupContext value={value}>{children}</NumberFlowGroupContext>
}

// Hooks
// ---

// SSR-safe canAnimate:
export function useCanAnimate({ respectMotionPreference = true } = {}) {
	const [canAnimate, setCanAnimate] = React.useState(false)
	const [reducedMotion, setReducedMotion] = React.useState(false)

	// Handle SSR:
	React.useEffect(() => {
		setCanAnimate(_canAnimate)
		setReducedMotion(prefersReducedMotion?.matches ?? false)
	}, [])

	// Listen for reduced motion changes if needed:
	React.useEffect(() => {
		if (!respectMotionPreference) return
		const onChange = ({ matches }: MediaQueryListEvent) => {
			setReducedMotion(matches)
		}
		prefersReducedMotion?.addEventListener('change', onChange)
		return () => {
			prefersReducedMotion?.removeEventListener('change', onChange)
		}
	}, [respectMotionPreference])

	return canAnimate && (!respectMotionPreference || !reducedMotion)
}
