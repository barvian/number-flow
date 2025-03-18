'use client'

// This has to be in a separate file for #95.
// Make sure tsup outputs both files.

import * as React from 'react'
import NumberFlowLite, {
	type Value,
	type Format,
	type Props,
	renderInnerHTML,
	formatToData,
	type Data,
	prefersReducedMotion as _prefersReducedMotion,
	canAnimate as _canAnimate,
	define
} from 'number-flow/lite'
import { BROWSER } from 'esm-env'

// Needed for SSR
// https://github.com/vercel/next.js/issues/65584
const OBSERVED_ATTRIBUTES = ['data', 'digits'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]
export class NumberFlowElement extends NumberFlowLite {
	static observedAttributes = OBSERVED_ATTRIBUTES
	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
		if (newValue) this[attr] = JSON.parse(newValue)
		this.removeAttribute(attr) // so it doesn't show up in the inspector. Fires another callback
	}
}

define('number-flow-react', NumberFlowElement)

type SnapshotterProps = {
	childRef: React.RefObject<NumberFlowElement | undefined>
	group?: GroupContext
	isolate?: boolean
	children: React.ReactNode
	data: Data
	animated: boolean
	respectMotionPreference: boolean
}
type SnapshotterState = {}
type SnapshotterSnapshot = (() => void) | null // React doesn't like undefined
class Snapshotter extends React.Component<SnapshotterProps, SnapshotterState, SnapshotterSnapshot> {
	override getSnapshotBeforeUpdate(prevProps: Readonly<SnapshotterProps>) {
		// Have to do these here and not as normal props, otherwise there's side effects:
		if (this.props.childRef.current) {
			this.props.childRef.current.batched = !this.props.isolate || Boolean(this.props.group)
			this.props.childRef.current.animated = this.props.animated
			this.props.childRef.current.respectMotionPreference = this.props.respectMotionPreference
		}

		if (this.props.data !== prevProps.data) {
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
	transformTiming = NumberFlowElement.defaultProps.transformTiming,
	spinTiming = NumberFlowElement.defaultProps.spinTiming,
	opacityTiming = NumberFlowElement.defaultProps.opacityTiming,
	animated = NumberFlowElement.defaultProps.animated,
	respectMotionPreference = NumberFlowElement.defaultProps.respectMotionPreference,
	trend = NumberFlowElement.defaultProps.trend,
	plugins = NumberFlowElement.defaultProps.plugins,
	digits = NumberFlowElement.defaultProps.digits,
	ref: _ref,
	...props
}: NumberFlowProps) {
	React.useImperativeHandle(_ref, () => ref.current!, [])
	const ref = React.useRef<NumberFlowElement>(null)
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
		<Snapshotter
			isolate={isolate}
			group={group}
			data={data}
			animated={animated}
			respectMotionPreference={respectMotionPreference}
			childRef={ref}
		>
			{/* @ts-expect-error missing types */}
			<number-flow-react
				{...props}
				ref={ref}
				data-will-change={willChange ? '' : undefined}
				// Have to rename these:
				class={className}
				onanimationsstart={onAnimationsStart}
				onanimationsfinish={onAnimationsFinish}
				transformTiming={transformTiming}
				spinTiming={spinTiming}
				opacityTiming={opacityTiming}
				trend={trend}
				plugins={plugins}
				dangerouslySetInnerHTML={{ __html: BROWSER ? '' : renderInnerHTML(data) }}
				suppressHydrationWarning
				digits={BROWSER ? digits : JSON.stringify(digits)}
				// Make sure data is set last so everything else is updated first (order matters):
				data={BROWSER ? data : JSON.stringify(data)}
			/>
		</Snapshotter>
	)
}

export default NumberFlow

// NumberFlowGroup

type GroupContext = {
	useRegister: (ref: React.MutableRefObject<NumberFlowElement | null>) => void
	willUpdate: () => void
	didUpdate: () => void
}

const NumberFlowGroupContext = React.createContext<GroupContext | undefined>(undefined)

export function NumberFlowGroup({ children }: { children: React.ReactNode }) {
	const flows = React.useRef(new Set<React.MutableRefObject<NumberFlowElement | null>>())
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

	return <NumberFlowGroupContext.Provider value={value}>{children}</NumberFlowGroupContext.Provider>
}
