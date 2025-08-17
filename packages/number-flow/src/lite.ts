import { createElement, offset, visible, type HTMLProps, type Justify } from './util/dom'
import { forEach } from './util/iterable'
import {
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type NumberPartKey,
	type Data
} from './formatter'
import { ServerSafeHTMLElement } from './ssr'
import styles, {
	supportsMod,
	supportsLinear,
	dxVar,
	opacityDeltaVar,
	prefersReducedMotion,
	supportsAtProperty,
	widthDeltaVar,
	deltaVar
} from './styles'
import type { Mutable as MakeMutable } from './util/types'
import type { Plugin } from './plugins'

export { define } from './util/dom'
export { prefersReducedMotion } from './styles'
export { renderInnerHTML } from './ssr'
export * from './plugins'
export * from './formatter'

export const canAnimate = supportsMod && supportsLinear && supportsAtProperty

// Hoping to use -1 | 0 | 1 in the future if Math.sign types ever get fixed.
// Don't do ReturnType<Math['sign']> cause it breaks Vue prop types:
export type Trend = number | ((oldValue: number, value: number) => number)

export type DigitOptions = { max?: number }
export type Digits = Record<number, DigitOptions>

export interface Props {
	transformTiming: EffectTiming
	spinTiming: EffectTiming | undefined
	opacityTiming: EffectTiming
	animated: boolean
	respectMotionPreference: boolean
	trend: Trend
	plugins?: Plugin[]
	digits: Digits | undefined
}

let styleSheet: CSSStyleSheet | undefined

// Workaround for Object.assign in constructor and TS:
// https://github.com/microsoft/TypeScript/issues/26792#issuecomment-617541464
export default interface NumberFlowLite extends Props {}

// Workaround for no outside-readable/inside-writable members in TS:
// https://github.com/microsoft/TypeScript/issues/37487
type Mutable = MakeMutable<NumberFlowLite>

/**
 * @internal Used for framework wrappers
 */
export default class NumberFlowLite extends ServerSafeHTMLElement implements Props {
	/**
	 * Use `private _private` properties instead of `#private` to avoid # polyfill and
	 * reduce bundle size. Also, use `readonly` properties instead of getters to save on bundle
	 * size, even though you have to do gross stuff like `(this as Mutable<...>)` until TS
	 * supports e.g. https://github.com/microsoft/TypeScript/issues/37487
	 */

	static defaultProps: Props = {
		transformTiming: {
			duration: 900,
			// Make sure to keep this minified:
			easing: `linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)`
		},
		spinTiming: undefined,
		opacityTiming: { duration: 450, easing: 'ease-out' },
		animated: true,
		trend: (oldValue, value) => Math.sign(value - oldValue),
		respectMotionPreference: true,
		plugins: undefined,
		digits: undefined
	}

	constructor() {
		super()
		const { animated, ...props } = (this.constructor as typeof NumberFlowLite).defaultProps
		this._animated = this.computedAnimated = animated
		Object.assign(this, props)
	}

	private _animated: boolean
	get animated() {
		return this._animated
	}
	set animated(val: boolean) {
		if (this.animated === val) return
		this._animated = val
		// Finish any in-flight animations (instead of cancel, which won't trigger their finish events):
		this.shadowRoot?.getAnimations().forEach((a) => a.finish())
	}

	readonly created: boolean = false

	private _pre?: SymbolSection
	private _num?: Num
	private _post?: SymbolSection

	readonly computedTrend?: number

	readonly computedAnimated: boolean

	private _internals?: ElementInternals

	private _data?: Data

	/**
	 * @internal
	 */
	batched = false

	/**
	 * @internal
	 */
	set data(data: Data | undefined) {
		if (data == null) {
			return
		}

		const { pre, integer, fraction, post, value } = data

		// Initialize if needed
		if (!this.created) {
			this._data = data

			// This will overwrite the DSD if any:
			this.attachShadow({ mode: 'open' })

			try {
				this._internals ??= this.attachInternals()
				this._internals.role = 'img'
			} catch {
				// Don't error in old browsers that don't support ElementInternals
				// Try/catch is less code than an if check.
			}

			// Add stylesheet
			if (typeof CSSStyleSheet !== 'undefined' && this.shadowRoot!.adoptedStyleSheets) {
				if (!styleSheet) {
					styleSheet = new CSSStyleSheet()
					styleSheet.replaceSync(styles)
				}
				this.shadowRoot!.adoptedStyleSheets = [styleSheet]
			} else {
				const style = document.createElement('style')
				style.textContent = styles
				this.shadowRoot!.appendChild(style)
			}

			this._pre = new SymbolSection(this, pre, {
				justify: 'right',
				part: 'left'
			})
			this.shadowRoot!.appendChild(this._pre.el)

			this._num = new Num(this, integer, fraction)
			this.shadowRoot!.appendChild(this._num.el)

			this._post = new SymbolSection(this, post, {
				justify: 'left',
				part: 'right'
			})
			this.shadowRoot!.appendChild(this._post.el)
			;(this as Mutable).created = true
		} else {
			const prev = this._data!
			this._data = data

			// Compute trend
			;(this as Mutable).computedTrend =
				typeof this.trend === 'function' ? this.trend(prev.value, value) : this.trend
			;(this as Mutable).computedAnimated =
				canAnimate &&
				this._animated &&
				(!this.respectMotionPreference || !prefersReducedMotion?.matches) &&
				// https://github.com/barvian/number-flow/issues/9
				visible(this)

			this.plugins?.forEach((p) => p.onUpdate?.(data, prev, this))

			if (!this.batched) this.willUpdate()

			this._pre!.update(pre)
			this._num!.update({ integer, fraction })
			this._post!.update(post)

			if (!this.batched) this.didUpdate()
		}

		try {
			this._internals!.ariaLabel = data.valueAsString
		} catch {
			// Don't error in old browsers that don't support ElementInternals
			// Try/catch is less code than an if check.
		}
	}

	/**
	 * @internal
	 */
	willUpdate() {
		// Not super safe to check animated here, b/c the prop may not have been updated yet:
		this._pre!.willUpdate()
		this._num!.willUpdate()
		this._post!.willUpdate()
	}

	private _abortAnimationsFinish?: AbortController

	/**
	 * @internal
	 */
	didUpdate() {
		// Safe to call this here because we know the animated prop is up-to-date
		if (!this.computedAnimated) return

		// If we're already animating, cancel the previous animationsfinish event:
		if (this._abortAnimationsFinish) this._abortAnimationsFinish.abort()
		// Otherwise, dispatch a start event:
		else this.dispatchEvent(new Event('animationsstart'))

		this._pre!.didUpdate()
		this._num!.didUpdate()
		this._post!.didUpdate()

		const controller = new AbortController()
		Promise.all(this.shadowRoot!.getAnimations().map((a) => a.finished)).then(() => {
			if (!controller.signal.aborted) {
				this.dispatchEvent(new Event('animationsfinish'))
				this._abortAnimationsFinish = undefined
			}
		})
		this._abortAnimationsFinish = controller
	}
}

class Num {
	readonly el: HTMLSpanElement
	readonly _inner: HTMLSpanElement

	private _integer: NumberSection
	private _fraction: NumberSection

	constructor(
		readonly flow: NumberFlowLite,
		integer: KeyedNumberPart[],
		fraction: KeyedNumberPart[],
		{ className, ...props }: HTMLProps<'span'> = {}
	) {
		this._integer = new NumberSection(flow, integer, {
			justify: 'right',
			part: 'integer'
		})
		this._fraction = new NumberSection(flow, fraction, {
			justify: 'left',
			part: 'fraction'
		})

		this._inner = createElement(
			'span',
			{
				className: `number__inner`
			},
			[this._integer.el, this._fraction.el]
		)
		this.el = createElement(
			'span',
			{
				...props,
				part: 'number',
				className: `number ${className ?? ''}`
			},
			[this._inner]
		)
	}

	private _prevWidth?: number
	private _prevLeft?: number

	willUpdate() {
		this._prevWidth = this.el.offsetWidth
		this._prevLeft = this.el.getBoundingClientRect().left

		this._integer.willUpdate()
		this._fraction.willUpdate()
	}

	update({ integer, fraction }: Pick<Data, 'integer' | 'fraction'>) {
		this._integer.update(integer)
		this._fraction.update(fraction)
	}

	didUpdate() {
		const rect = this.el.getBoundingClientRect()

		// Do this before starting to animate:
		this._integer.didUpdate()
		this._fraction.didUpdate()

		const dx = this._prevLeft! - rect.left

		const width = this.el.offsetWidth
		// We convert scale to width delta in px to better handle interruptions and keep them in
		// sync with translations:
		const dWidth = this._prevWidth! - width
		this.el.style.setProperty('--width', String(width))

		this.el.animate(
			{
				[dxVar]: [`${dx}px`, '0px'],
				[widthDeltaVar]: [dWidth, 0]
			},
			{
				...this.flow.transformTiming,
				composite: 'accumulate'
			}
		)
	}
}

type SectionProps = { justify: Justify } & HTMLProps<'span'>

abstract class Section {
	readonly el: HTMLSpanElement
	readonly justify: Justify

	// All children in the DOM:
	protected children = new Map<NumberPartKey, Char>()

	constructor(
		readonly flow: NumberFlowLite,
		parts: KeyedNumberPart[],
		{ justify, className, ...props }: SectionProps,
		children?: (chars: Node[]) => Node[]
	) {
		this.justify = justify
		const chars = parts.map<Node>((p) => this.addChar(p).el)

		this.el = createElement(
			'span',
			{
				...props,
				className: `section section--justify-${justify} ${className ?? ''}`
			},
			children ? children(chars) : chars
		)
	}

	protected addChar(
		part: KeyedNumberPart,
		{
			startDigitsAtZero = false,
			...props
		}: { startDigitsAtZero?: boolean } & Pick<AnimatePresenceProps, 'animateIn'> = {}
	) {
		const comp =
			part.type === 'integer' || part.type === 'fraction'
				? new Digit(this, part.type, startDigitsAtZero ? 0 : part.value, part.pos, {
						...props,
						onRemove: this.onCharRemove(part.key)
					})
				: new Sym(this, part.type, part.value, {
						...props,
						onRemove: this.onCharRemove(part.key)
					})
		this.children.set(part.key, comp)
		return comp
	}

	private onCharRemove =
		(key: NumberPartKey): OnRemove =>
		() => {
			this.children.delete(key)
		}

	protected unpop(char: Char) {
		char.el.removeAttribute('inert')
		char.el.style.top = ''
		char.el.style[this.justify] = ''
	}

	protected pop(chars: Map<any, Char>) {
		// Batch all layout offset reads before popping, to avoid layout thrashing:
		const positions = new Map<Char, { top: number; offset: number }>()
		chars.forEach((char) => {
			positions.set(char, {
				top: char.el.offsetTop,
				offset: offset(char.el, this.justify)
			})
		})

		// Batch all style writes
		chars.forEach((char) => {
			const pos = positions.get(char)!
			char.el.style.top = `${pos.top}px`
			char.el.style[this.justify] = `${pos.offset}px`
			char.el.setAttribute('inert', '')
			char.present = false
		})
	}

	protected addNewAndUpdateExisting(parts: KeyedNumberPart[]) {
		const added = new Map<KeyedNumberPart, Char>()
		const updated = new Map<KeyedNumberPart, Char>()

		// Add new parts before any other updates, so we can save their position correctly:
		const reverse = this.justify === 'left'
		const op = reverse ? 'prepend' : 'append'
		forEach(
			parts,
			(part) => {
				let comp: Char
				// Already exists/needs update, so set aside for now
				if (this.children.has(part.key)) {
					comp = this.children.get(part.key)!
					updated.set(part, comp)
					this.unpop(comp)
					comp.present = true
				} else {
					// New part
					comp = this.addChar(part, { startDigitsAtZero: true, animateIn: true })
					added.set(part, comp)
				}
				this.el[op](comp.el)
			},
			{ reverse }
		)

		if (this.flow.computedAnimated) {
			const rect = this.el.getBoundingClientRect() // this should only cause a layout if there were added children (?)
			added.forEach((comp) => {
				comp.willUpdate(rect)
			})
		}
		// Update added children to their initial value (we start them at 0)
		added.forEach((comp, part) => {
			comp.update(part.value)
		})

		// Update any updated children
		updated.forEach((comp, part) => {
			comp.update(part.value)
		})
	}

	private _prevOffset?: number

	willUpdate() {
		const rect = this.el.getBoundingClientRect()
		this._prevOffset = rect[this.justify]

		this.children.forEach((comp) => comp.willUpdate(rect))
	}

	didUpdate() {
		const rect = this.el.getBoundingClientRect()

		// Make sure to pass this in before starting to animate:
		this.children.forEach((comp) => comp.didUpdate(rect))

		// Early exit if animations are disabled
		if (!this.flow.computedAnimated) return

		const offset = rect[this.justify]
		const dx = this._prevOffset! - offset

		// Technically checking for children could get weird during multiple interruptions
		// but probably still worth it;
		if (dx && this.children.size)
			this.el.animate(
				{
					transform: [`translateX(${dx}px)`, 'none']
				},
				{
					...this.flow.transformTiming,
					composite: 'accumulate'
				}
			)
	}
}

class NumberSection extends Section {
	update(parts: KeyedNumberPart[]) {
		const removed = new Map<NumberPartKey, Char>()

		this.children.forEach((comp, key) => {
			// Keep track of removed children:
			if (!parts.find((p) => p.key === key)) {
				removed.set(key, comp)
			}
			// Put everything back into the flow briefly, to recompute offsets:
			this.unpop(comp)
		})

		this.addNewAndUpdateExisting(parts)

		// Set all removed digits to 0, for mathematical correctness:
		removed.forEach((comp) => {
			if (comp instanceof Digit) comp.update(0)
		})

		// Then end with them popped out again:
		this.pop(removed)
	}
}

class SymbolSection extends Section {
	update(parts: KeyedNumberPart[]) {
		const removed = new Map<NumberPartKey, Char>()

		this.children.forEach((comp, key) => {
			// Keep track of removed children:
			if (!parts.find((p) => p.key === key)) {
				removed.set(key, comp)
			}
		})

		// Pop them, before any additions
		this.pop(removed)

		this.addNewAndUpdateExisting(parts)
	}
}

type OnRemove = () => void
interface AnimatePresenceProps {
	onRemove?: OnRemove
	animateIn?: boolean
}

class AnimatePresence {
	private _present = true
	private _onRemove?: OnRemove

	constructor(
		readonly flow: NumberFlowLite,
		readonly el: HTMLElement,
		{ onRemove, animateIn = false }: AnimatePresenceProps = {}
	) {
		this.el.classList.add('animate-presence')
		// This craziness is the only way I could figure out how to get the opacity
		// accumulation to work in all browsers. Accumulating -1 onto opacity directly
		// failed in both FF and Safari, and setting a delta to -1 still failed in FF
		if (this.flow.computedAnimated && animateIn) {
			this.el.animate(
				{
					[opacityDeltaVar]: [-0.9999, 0]
				},
				{
					...this.flow.opacityTiming,
					composite: 'accumulate'
				}
			)
		}

		this._onRemove = onRemove
	}

	get present() {
		return this._present
	}

	private _remove = () => {
		this.el.remove()
		this._onRemove?.()
	}

	set present(val) {
		if (this._present === val) return
		this._present = val
		if (val) this.el.removeAttribute('inert')
		else this.el.setAttribute('inert', '')

		if (!this.flow.computedAnimated) {
			if (!val) this._remove()
			return
		}

		this.el.style.setProperty('--_number-flow-d-opacity', val ? '0' : '-.999')
		this.el.animate(
			{
				[opacityDeltaVar]: val ? [-0.9999, 0] : [0.999, 0]
			},
			{
				...this.flow.opacityTiming,
				composite: 'accumulate'
			}
		)

		if (val) this.flow.removeEventListener('animationsfinish', this._remove)
		else
			this.flow.addEventListener('animationsfinish', this._remove, {
				once: true
			})
	}
}

interface CharProps extends AnimatePresenceProps {}

abstract class Char<P extends KeyedNumberPart = KeyedNumberPart> extends AnimatePresence {
	constructor(
		readonly section: Section,
		protected value: P['value'],
		override readonly el: HTMLSpanElement,
		props?: AnimatePresenceProps
	) {
		super(section.flow, el, props)
	}

	abstract willUpdate(parentRect: DOMRect): void
	abstract update(value: P['value']): void
	abstract didUpdate(parentRect: DOMRect): void
}

export class Digit extends Char<KeyedDigitPart> {
	private _numbers: HTMLSpanElement[]
	readonly length: number

	constructor(
		section: Section,
		type: KeyedDigitPart['type'],
		value: KeyedDigitPart['value'],
		readonly pos: number,
		props?: CharProps
	) {
		const length = (section.flow.digits?.[pos]?.max ?? 9) + 1
		const numbers = Array.from({ length }).map((_, i) => {
			const num = createElement('span', { className: `digit__num` }, [
				document.createTextNode(String(i))
			])
			// Use the attribute for now because it has a little better browser support:
			if (i !== value) num.setAttribute('inert', '')
			num.style.setProperty('--n', String(i))
			return num
		})
		const el = createElement(
			'span',
			{
				part: `digit ${type}-digit`,
				className: `digit`
			},
			numbers
		)
		el.style.setProperty('--current', String(value))
		el.style.setProperty('--length', String(length))

		super(section, value, el, props)

		this._numbers = numbers
		this.length = length
	}

	private _prevValue?: KeyedDigitPart['value']

	// Relative to parent:
	private _prevCenter?: number

	willUpdate(parentRect: DOMRect) {
		const rect = this.el.getBoundingClientRect()

		this._prevValue = this.value

		const prevOffset = rect[this.section.justify] - parentRect[this.section.justify]
		const halfWidth = rect.width / 2
		this._prevCenter =
			this.section.justify === 'left' ? prevOffset + halfWidth : prevOffset - halfWidth
	}

	update(value: KeyedDigitPart['value']) {
		this.el.style.setProperty('--current', String(value))
		this._numbers.forEach((num, i) =>
			i === value ? num.removeAttribute('inert') : num.setAttribute('inert', '')
		)
		this.value = value
	}

	didUpdate(parentRect: DOMRect) {
		// Early exit if animations are disabled
		if (!this.flow.computedAnimated) return

		const rect = this.el.getBoundingClientRect()
		const offset = rect[this.section.justify] - parentRect[this.section.justify]
		const halfWidth = rect.width / 2
		const center = this.section.justify === 'left' ? offset + halfWidth : offset - halfWidth
		const dx = this._prevCenter! - center

		if (dx)
			this.el.animate(
				{
					transform: [`translateX(${dx}px)`, 'none']
				},
				{
					...this.flow.transformTiming,
					composite: 'accumulate'
				}
			)

		const delta = this.getDelta()
		if (!delta) return

		this.el.classList.add('is-spinning')
		this.el.animate(
			{
				[deltaVar]: [-delta, 0]
			},
			{
				...(this.flow.spinTiming ?? this.flow.transformTiming),
				composite: 'accumulate'
			}
		)
		// Hoisting the callback out prevents duplicates:
		this.flow.addEventListener('animationsfinish', this._onAnimationsFinish, { once: true })
	}

	getDelta() {
		if (this.flow.plugins)
			for (const plugin of this.flow.plugins) {
				const diff = plugin.getDelta?.(this.value, this._prevValue!, this)
				if (diff != null) return diff
			}

		const diff = this.value - this._prevValue!
		// Make it per-digit if no root trend:
		const trend = this.flow.computedTrend || Math.sign(diff)
		// Loop around if need be:
		if (trend < 0 && this.value > this._prevValue!)
			return this.value - this.length - this._prevValue!
		else if (trend > 0 && this.value < this._prevValue!)
			return this.length - this._prevValue! + this.value

		return diff
	}

	private _onAnimationsFinish = () => {
		this.el.classList.remove('is-spinning')
	}
}

class Sym extends Char<KeyedSymbolPart> {
	constructor(
		section: Section,
		private type: KeyedSymbolPart['type'],
		value: KeyedSymbolPart['value'],
		props?: CharProps
	) {
		const val = createElement('span', {
			className: 'symbol__value',
			textContent: value
		})
		super(
			section,
			value,
			createElement(
				'span',
				{
					part: `symbol ${type}`,
					className: `symbol`
				},
				[val]
			),
			props
		)
		this._children.set(
			value,
			new AnimatePresence(this.flow, val, {
				onRemove: this._onChildRemove(value)
			})
		)
	}

	private _children = new Map<KeyedSymbolPart['value'], AnimatePresence>()

	private _prevOffset?: number

	willUpdate(parentRect: DOMRect) {
		if (this.type === 'decimal') return // decimal never needs animation b/c it's the first in a left aligned section and never moves

		const rect = this.el.getBoundingClientRect()
		this._prevOffset = rect[this.section.justify] - parentRect[this.section.justify]
	}

	private _onChildRemove =
		(key: KeyedSymbolPart['value']): OnRemove =>
		() => {
			this._children.delete(key)
		}

	update(value: KeyedSymbolPart['value']) {
		if (this.value !== value) {
			// Pop the current value:
			const current = this._children.get(this.value)
			if (current) current.present = false

			// If we already have the new value and it hasn't finished removing, reclaim it:
			const prev = this._children.get(value)
			if (prev) {
				prev.present = true
			} else {
				// Otherwise, create a new one:
				const newVal = createElement('span', {
					className: 'symbol__value',
					textContent: value
				})
				this.el.appendChild(newVal)
				this._children.set(
					value,
					new AnimatePresence(this.flow, newVal, {
						animateIn: true,
						onRemove: this._onChildRemove(value)
					})
				)
			}
		}
		this.value = value
	}

	didUpdate(parentRect: DOMRect) {
		if (this.type === 'decimal') return

		const rect = this.el.getBoundingClientRect()
		const offset = rect[this.section.justify] - parentRect[this.section.justify]
		const dx = this._prevOffset! - offset

		if (dx)
			this.el.animate(
				{
					transform: [`translateX(${dx}px)`, 'none']
				},
				{ ...this.flow.transformTiming, composite: 'accumulate' }
			)
	}
}
