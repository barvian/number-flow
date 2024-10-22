import { createElement, offset, type HTMLProps, type Justify } from './util/dom'
import { forEach } from './util/iterable'
import {
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type NumberPartKey,
	type PartitionedParts
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
import { BROWSER } from 'esm-env'
import { max } from './util/math'

export { SlottedTag, slottedStyles, prefersReducedMotion } from './styles'
export * from './formatter'

export const canAnimate = supportsMod && supportsLinear && supportsAtProperty

type RawTrend = boolean | 'increasing' | 'decreasing'
export { type RawTrend as Trend }

enum Trend {
	UP = 1,
	DOWN = -1,
	NONE = 0
}

export const defaultOpacityTiming: EffectTiming = { duration: 450, easing: 'ease-out' }

export const defaultTransformTiming: EffectTiming = {
	duration: 900,
	// Make sure to keep this minified:
	easing: `linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)`
}

let styleSheet: CSSStyleSheet | undefined

// This one is used internally for framework wrappers, and
// doesn't include things like attribute support:
export class NumberFlowLite extends ServerSafeHTMLElement {
	static define() {
		if (BROWSER) {
			const registeredElement = customElements.get('number-flow')

			// If an element is already registered with the same name by another library, warn the user.
			if (registeredElement && registeredElement.constructor !== this.constructor) {
				console.error(
					'An element has already been defined under the name `number-flow`. NumberFlow is not compatible in this case.'
				)
				return
			}

			// If the element is not registered, register it.
			if (!registeredElement) {
				customElements.define('number-flow', this)
			}
		}
	}

	transformTiming = defaultTransformTiming
	spinTiming?: EffectTiming
	opacityTiming = defaultOpacityTiming
	#animated = true
	manual = false
	respectMotionPreference = true

	#created = false
	#pre?: SymbolSection
	#num?: Num
	#post?: SymbolSection

	trend: RawTrend = true
	#computedTrend?: Trend
	continuous = false

	#startingPlace?: number | null

	get startingPlace() {
		return this.#startingPlace
	}
	get computedTrend() {
		return this.#computedTrend
	}

	#parts?: PartitionedParts

	set parts(parts: PartitionedParts | undefined) {
		if (parts == null) {
			return
		}

		const { pre, integer, fraction, post, value } = parts

		// Initialize if needed
		if (!this.#created) {
			this.#parts = parts

			// Don't check for declarative shadow DOM because we'll recreate it anyway:
			if (!this.shadowRoot) {
				this.attachShadow({ mode: 'open' })
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

			this.shadowRoot!.appendChild(createElement('slot'))

			this.#pre = new SymbolSection(this, pre, {
				inert: true,
				ariaHidden: 'true',
				justify: 'right'
			})
			this.shadowRoot!.appendChild(this.#pre.el)

			this.#num = new Num(this, integer, fraction, {
				inert: true,
				ariaHidden: 'true'
			})
			this.shadowRoot!.appendChild(this.#num.el)

			this.#post = new SymbolSection(this, post, {
				inert: true,
				ariaHidden: 'true',
				justify: 'left'
			})
			this.shadowRoot!.appendChild(this.#post.el)
		} else {
			const prev = this.#parts!
			this.#parts = parts

			// Compute trend
			if (this.trend === true) {
				this.#computedTrend = Math.sign(value - prev.value)
			} else if (this.trend === 'increasing') {
				this.#computedTrend = Trend.UP
			} else if (this.trend === 'decreasing') {
				this.#computedTrend = Trend.DOWN
			} else this.#computedTrend = Trend.NONE

			// Compute starting place for continuous
			this.#startingPlace = undefined
			if (this.#computedTrend !== Trend.NONE && this.continuous) {
				// Find the starting place based on the parts, not the value,
				// to handle e.g. compact notation where value = 1000 and integer part = 1
				const prevNumber = prev.integer
					.concat(prev.fraction)
					.filter((p) => p.type === 'integer' || p.type === 'fraction')
				const number = parts.integer
					.concat(parts.fraction)
					.filter((p) => p.type === 'integer' || p.type === 'fraction')
				const firstChangedPrev = prevNumber.find(
					(pp) => !number.find((p) => p.place === pp.place && p.value === pp.value)
				)
				const firstChanged = number.find(
					(p) => !prevNumber.find((pp) => p.place === pp.place && p.value === pp.value)
				)
				this.#startingPlace = max(firstChangedPrev?.place, firstChanged?.place)
			}

			if (!this.manual) this.willUpdate()

			this.#pre!.update(pre)
			this.#num!.update({ integer, fraction })
			this.#post!.update(post)

			if (!this.manual) this.didUpdate()
		}

		this.#created = true
	}

	willUpdate() {
		// In general this should be disable most animations except the ones that run
		// during an update, i.e. new digits and AnimatePresence. So make sure to handle those
		// separately:
		if (!this.animated) return

		this.#pre!.willUpdate()
		this.#num!.willUpdate()
		this.#post!.willUpdate()
	}

	#abortAnimationsFinish?: AbortController

	didUpdate() {
		if (!this.animated) return

		// If we're already animating, cancel the previous animationsfinish event:
		if (this.#abortAnimationsFinish) this.#abortAnimationsFinish.abort()
		// Otherwise, dispatch a start event:
		else this.dispatchEvent(new Event('animationsstart'))

		this.#pre!.didUpdate()
		this.#num!.didUpdate()
		this.#post!.didUpdate()

		const controller = new AbortController()
		Promise.all(this.shadowRoot!.getAnimations().map((a) => a.finished)).then(() => {
			if (!controller.signal.aborted) {
				this.dispatchEvent(new Event('animationsfinish'))
				this.#abortAnimationsFinish = undefined
			}
		})
		this.#abortAnimationsFinish = controller
	}

	get animated() {
		return (
			canAnimate &&
			this.#animated &&
			(!this.respectMotionPreference || !prefersReducedMotion?.matches)
		)
	}

	set animated(val: boolean) {
		if (this.animated === val) return
		this.#animated = val
		// Finish any in-flight animations (instead of cancel, which won't trigger their finish events):
		this.shadowRoot?.getAnimations().forEach((a) => a.finish())
	}
}

class Num {
	readonly el: HTMLSpanElement
	readonly #inner: HTMLSpanElement

	#integer: NumberSection
	#fraction: NumberSection

	constructor(
		readonly flow: NumberFlowLite,
		integer: KeyedNumberPart[],
		fraction: KeyedNumberPart[],
		{ className, ...props }: HTMLProps<'span'> = {}
	) {
		this.#integer = new NumberSection(flow, integer, {
			justify: 'right'
		})
		this.#fraction = new NumberSection(flow, fraction, {
			justify: 'left'
		})

		this.#inner = createElement(
			'span',
			{
				className: `number__inner`
			},
			[this.#integer.el, this.#fraction.el]
		)
		this.el = createElement(
			'span',
			{
				...props,
				className: `number ${className ?? ''}`
			},
			[this.#inner]
		)
	}

	#prevWidth?: number
	#prevLeft?: number

	willUpdate() {
		this.#prevWidth = this.el.offsetWidth
		this.#prevLeft = this.el.getBoundingClientRect().left

		this.#integer.willUpdate()
		this.#fraction.willUpdate()
	}

	update({ integer, fraction }: Pick<PartitionedParts, 'integer' | 'fraction'>) {
		this.#integer.update(integer)
		this.#fraction.update(fraction)
	}

	didUpdate() {
		const rect = this.el.getBoundingClientRect()

		// Do this before starting to animate:
		this.#integer.didUpdate()
		this.#fraction.didUpdate()

		const dx = this.#prevLeft! - rect.left

		const width = this.el.offsetWidth
		// We convert scale to width delta in px to better handle interruptions and keep them in
		// sync with translations:
		const dWidth = this.#prevWidth! - width
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
				? new Digit(this, part.type, startDigitsAtZero ? 0 : part.value, part.place, {
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
		char.el.classList.remove('section__exiting')
		char.el.style[this.justify] = ''
	}

	protected pop(chars: Map<any, Char>) {
		// Calculate offsets for removed before popping, to avoid layout thrashing:
		chars.forEach((char) => {
			char.el.style[this.justify] = `${offset(char.el, this.justify)}px`
		})
		chars.forEach((char) => {
			char.el.classList.add('section__exiting')
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

		if (this.flow.animated) {
			const rect = this.el.getBoundingClientRect() // this should only cause a layout if there were added children
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

	#prevOffset?: number

	willUpdate() {
		const rect = this.el.getBoundingClientRect()
		this.#prevOffset = rect[this.justify]

		this.children.forEach((comp) => comp.willUpdate(rect))
	}

	didUpdate() {
		const rect = this.el.getBoundingClientRect()

		// Make sure to pass this in before starting to animate:
		this.children.forEach((comp) => comp.didUpdate(rect))

		const offset = rect[this.justify]
		const dx = this.#prevOffset! - offset

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
	#present = true
	#onRemove?: OnRemove

	constructor(
		readonly flow: NumberFlowLite,
		readonly el: HTMLElement,
		{ onRemove, animateIn = false }: AnimatePresenceProps = {}
	) {
		this.el.classList.add('animate-presence')
		// This craziness is the only way I could figure out how to get the opacity
		// accumulation to work in all browsers. Accumulating -1 onto opacity directly
		// failed in both FF and Safari, and setting a delta to -1 still failed in FF
		if (this.flow.animated && animateIn) {
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

		this.#onRemove = onRemove
	}

	get present() {
		return this.#present
	}

	#remove = () => {
		this.el.remove()
		this.#onRemove?.()
	}

	set present(val) {
		if (this.#present === val) return
		this.#present = val

		if (!this.flow.animated) {
			if (!val) this.#remove()
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

		if (val) this.flow.removeEventListener('animationsfinish', this.#remove)
		else
			this.flow.addEventListener('animationsfinish', this.#remove, {
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

class Digit extends Char<KeyedDigitPart> {
	#numbers: HTMLSpanElement[]

	constructor(
		section: Section,
		_: KeyedDigitPart['type'],
		value: KeyedDigitPart['value'],
		readonly place: number,
		props?: CharProps
	) {
		const numbers = Array.from({ length: 10 }).map((_, i) => {
			const num = createElement(
				'span',
				{ className: `digit__num${i === value ? ' is-current' : ''}` },
				[document.createTextNode(String(i))]
			)
			num.style.setProperty('--n', String(i))
			return num
		})
		const el = createElement(
			'span',
			{
				className: `digit`
			},
			numbers
		)
		el.style.setProperty('--current', String(value))

		super(section, value, el, props)

		this.#numbers = numbers
	}

	#prevValue?: KeyedDigitPart['value']

	// Relative to parent:
	#prevCenter?: number

	willUpdate(parentRect: DOMRect) {
		const rect = this.el.getBoundingClientRect()

		this.#prevValue = this.value

		const prevOffset = rect[this.section.justify] - parentRect[this.section.justify]
		const halfWidth = rect.width / 2
		this.#prevCenter =
			this.section.justify === 'left' ? prevOffset + halfWidth : prevOffset - halfWidth
	}

	update(value: KeyedDigitPart['value']) {
		this.#numbers[this.value]?.classList.remove('is-current')
		this.el.style.setProperty('--current', String(value))
		this.#numbers[value]?.classList.add('is-current')
		this.value = value
	}

	didUpdate(parentRect: DOMRect) {
		const rect = this.el.getBoundingClientRect()
		const offset = rect[this.section.justify] - parentRect[this.section.justify]
		const halfWidth = rect.width / 2
		const center = this.section.justify === 'left' ? offset + halfWidth : offset - halfWidth

		this.el.animate(
			{
				transform: [`translateX(${this.#prevCenter! - center}px)`, 'none']
			},
			{
				...this.flow.transformTiming,
				composite: 'accumulate'
			}
		)

		const diff = this.diff
		if (!diff) return

		this.el.classList.add('is-spinning')
		this.el.animate(
			{
				[deltaVar]: [-diff, 0]
			},
			{
				...(this.flow.spinTiming ?? this.flow.transformTiming),
				composite: 'accumulate'
			}
		)
		// Hoisting the callback out prevents duplicates:
		this.flow.addEventListener('animationsfinish', this.#onAnimationsFinish, { once: true })
	}

	get diff() {
		let trend = this.flow.computedTrend
		const diff = this.value - this.#prevValue!
		// Loop once if it's continuous:
		if (!diff && this.flow.startingPlace != null && this.flow.startingPlace >= this.place) {
			return 10 * trend! // trend must exist if there's a startingPlace
		}

		// Make it per-digit if no root trend:
		trend ||= Math.sign(diff)
		// Loop around if need be:
		if (trend === Trend.DOWN && this.value > this.#prevValue!)
			return this.value - 10 - this.#prevValue!
		else if (trend === Trend.UP && this.value < this.#prevValue!)
			return 10 - this.#prevValue! + this.value

		return diff
	}

	#onAnimationsFinish = () => {
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
					className: `symbol`
				},
				[val]
			),
			props
		)
		this.#children.set(
			value,
			new AnimatePresence(this.flow, val, {
				onRemove: this.#onChildRemove(value)
			})
		)
	}

	#children = new Map<KeyedSymbolPart['value'], AnimatePresence>()

	#prevOffset?: number

	willUpdate(parentRect: DOMRect) {
		if (this.type === 'decimal') return // decimal never needs animation b/c it's the first in a left aligned section and never moves

		const rect = this.el.getBoundingClientRect()
		this.#prevOffset = rect[this.section.justify] - parentRect[this.section.justify]
	}

	#onChildRemove =
		(key: KeyedSymbolPart['value']): OnRemove =>
		() => {
			this.#children.delete(key)
		}

	update(value: KeyedSymbolPart['value']) {
		if (this.value !== value) {
			// Pop the current value:
			const current = this.#children.get(this.value)!
			current.present = false
			current.el.classList.add('symbol__exiting')

			// If we already have the new value and it hasn't finished removing, reclaim it:
			if (this.#children.has(value)) {
				const prev = this.#children.get(value)!
				prev.present = true
				prev.el.classList.remove('symbol__exiting')
			} else {
				// Otherwise, create a new one:
				const newVal = createElement('span', {
					className: 'symbol__value',
					textContent: value
				})
				this.el.appendChild(newVal)
				this.#children.set(
					value,
					new AnimatePresence(this.flow, newVal, {
						animateIn: true,
						onRemove: this.#onChildRemove(value)
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

		this.el.animate(
			{
				transform: [`translateX(${this.#prevOffset! - offset}px)`, 'none']
			},
			{ ...this.flow.transformTiming, composite: 'accumulate' }
		)
	}
}
