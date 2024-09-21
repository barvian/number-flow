import { createElement, offset, replaceChildren, type HTMLProps, type Justify } from './util/dom'
import { forEach } from './util/iterable'
import {
	formatToParts,
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type Format,
	type Value,
	type NumberPartKey
} from './formatter'
import { ServerSafeHTMLElement } from './ssr'
import styles, { maskHeight } from './styles'
import { frames, lerp, discreteFrames, type DiscreteKeyframeProps } from './util/animate'
import { BROWSER } from 'esm-env'
export { renderInnerHTML } from './ssr'
export type { Format, Value } from './formatter'

const OBSERVED_ATTRIBUTES = ['value', 'timing', 'manual'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]

const DEFAULT_TIMING: EffectTiming = {
	duration: 1
}

type Args = Value | [Value, locales?: Intl.LocalesArgument, format?: Format]

let styleSheet: CSSStyleSheet | undefined

class NumberFlow extends ServerSafeHTMLElement {
	static observedAttributes = OBSERVED_ATTRIBUTES

	timing = DEFAULT_TIMING
	#formatted?: string

	manual = false

	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
		if (attr === 'manual') this.manual = newValue != null
		this[attr] = JSON.parse(newValue)
	}

	get value(): string | undefined {
		return this.#formatted
	}

	#created = false
	#pre?: Section
	#integer?: Section
	#fraction?: Section
	#post?: Section
	#label?: HTMLSpanElement

	set value(newVal: Args | undefined) {
		if (newVal == null) {
			this.#formatted = undefined
			return
		}

		const { pre, integer, fraction, post, formatted } = Array.isArray(newVal)
			? formatToParts(...newVal)
			: formatToParts(newVal)

		// Initialize if needed
		if (!this.#created) {
			// Don't check for declarative shadow DOM because we'll recreate it anyway:
			this.attachShadow({ mode: 'open' })

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

			this.#label = createElement('span', { className: 'label' })
			this.shadowRoot!.appendChild(this.#label)

			this.#pre = new Section(this, pre, {
				part: 'pre',
				inert: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'pop'
			})
			this.shadowRoot!.appendChild(this.#pre.el)
			this.#integer = new Section(this, integer, {
				part: 'integer',
				inert: true,
				masked: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#integer.el)
			this.#fraction = new Section(this, fraction, {
				part: 'fraction',
				inert: true,
				masked: true,
				ariaHidden: 'true',
				justify: 'left',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#fraction.el)
			this.#post = new Section(this, post, {
				part: 'post',
				inert: true,
				ariaHidden: 'true',
				justify: 'left',
				exitMode: 'pop'
			})
			this.shadowRoot!.appendChild(this.#post.el)
		} else {
			if (!this.manual) this.willUpdate()

			this.#pre!.update(pre)
			this.#integer!.update(integer)
			this.#fraction!.update(fraction)
			this.#post!.update(post)

			if (!this.manual) this.didUpdate()
		}

		this.#label!.textContent = formatted

		this.#formatted = formatted
		this.#created = true
	}

	willUpdate() {
		this.#pre!.willUpdate()
		this.#integer!.willUpdate()
		this.#fraction!.willUpdate()
		this.#post!.willUpdate()
	}

	didUpdate() {
		this.#pre!.didUpdate()
		this.#integer!.didUpdate()
		this.#fraction!.didUpdate()
		this.#post!.didUpdate()
	}
}

type ExitMode = 'sync' | 'pop'

class Section {
	readonly el: HTMLSpanElement
	readonly #inner?: HTMLSpanElement
	readonly justify: Justify
	readonly exitMode: ExitMode
	readonly masked: boolean

	// A shortcut to #inner or el:
	readonly #wrapper: HTMLSpanElement

	// All children in the DOM:
	#children: Map<NumberPartKey, Char>

	constructor(
		readonly flow: NumberFlow,
		parts: KeyedNumberPart[],
		{
			justify,
			exitMode,
			masked = false,
			...opts
		}: { justify: Justify; exitMode: ExitMode; masked?: boolean } & HTMLProps<'section'>
	) {
		this.justify = justify
		this.exitMode = exitMode
		this.masked = masked

		this.#children = new Map()

		// Zero width space prevents the height from collapsing when no chars
		// TODO: replace this with height: 1lh when it's better supported:
		const innerHTML = '&#8203;'

		if (masked)
			this.#inner = createElement(
				'span',
				{
					className: 'section__inner',
					innerHTML
				},
				parts.map((part) => {
					const comp =
						part.type === 'integer' || part.type === 'fraction'
							? new Digit(this, part.type, part.value, 'section__char is-active')
							: new Sym(this, part.type, part.value, 'section__char is-active')
					this.#children.set(part.key, comp)
					return comp.el
				})
			)

		this.el = createElement(
			'span',
			{
				...opts,
				className: `section section--justify-${justify}${masked ? ' section--masked' : ''}`,
				...(this.#inner ? {} : { innerHTML })
			},
			this.#inner && [this.#inner]
		)
		this.#wrapper = this.#inner ?? this.el
	}

	#prevRect?: DOMRect

	willUpdate() {
		const rect = this.el.getBoundingClientRect()
		this.#prevRect = rect

		const wrapperRect = this.#inner?.getBoundingClientRect() ?? rect
		this.#children.forEach((comp) => comp.willUpdate(wrapperRect))
	}

	update(parts: KeyedNumberPart[]) {
		const added = new Map<KeyedNumberPart, Char>()
		const updated = new Map<KeyedNumberPart, Char>()
		const removed = new Map<NumberPartKey, Char>()

		// Find any removed children
		this.#children.forEach((comp, key) => {
			if (!parts.find((p) => p.key === key)) {
				removed.set(key, comp)
			}
			// Re-add any exiting children to re-compute their offsets later
			if (comp.el.classList.contains('section__exiting')) {
				comp.el.classList.remove('section__exiting')
				comp.el.style[this.justify] = ''
				requestAnimationFrame(() => comp.el.classList.add('is-active'))
			}
		})

		// Add new parts before any other updates, so we can save their position correctly:
		const reverse = this.justify === 'left' // we want to prepend for left
		const addOp = reverse ? 'prepend' : 'append'
		forEach(parts, reverse, (part) => {
			let comp: Char
			// Already exists/needs update, so set aside for now
			if (this.#children.has(part.key)) {
				comp = this.#children.get(part.key)!
				updated.set(part, comp)
			} else {
				// New part
				comp =
					part.type === 'integer' || part.type === 'fraction'
						? new Digit(this, part.type, 0, 'section__char') // always start at 0 for mathematical correctness
						: new Sym(this, part.type, part.value, 'section__char')
				added.set(part, comp)
				requestAnimationFrame(() => comp.el.classList.add('is-active'))
				this.#children.set(part.key, comp)
			}
			this.#wrapper[addOp](comp.el)
		})

		// Finish updating any added children
		const rect = this.#wrapper.getBoundingClientRect() // this should only cause a layout if there were added children
		added.forEach((comp) => {
			comp.willUpdate(rect)
		})
		// Update added children to their initial value (they start at 0)
		added.forEach((comp, part) => {
			comp.update(part.value)
		})

		// Update any updated children
		updated.forEach((comp, part) => {
			comp.update(part.value)
		})

		// Set all removed digits to 0, for mathematical correctness:
		removed.forEach((comp) => {
			if (comp instanceof Digit) comp.update(0)
		})
		// Calculate offsets for removed before popping, to avoid layout thrashing:
		removed.forEach((comp) => {
			comp.el.style[this.justify] = `${offset(comp.el, this.justify)}px`
		})
		// Then pop/update all
		removed.forEach((comp) => {
			comp.el.classList.add('section__exiting')
			requestAnimationFrame(() => comp.el.classList.remove('is-active'))
		})
	}

	#animation?: Animation
	#maskAnimation?: Animation
	#innerAnimation?: Animation

	didUpdate() {
		this.#children.forEach((comp) => comp.didUpdate(this.#wrapper.getBoundingClientRect()))

		// Cancel any previous animations before getting the new rects:
		this.#animation?.cancel()
		this.#innerAnimation?.cancel()
		this.#maskAnimation?.cancel()

		const rect = this.el.getBoundingClientRect()
		const scale = this.masked
			? Math.max(this.#prevRect!.width, 0.01) / Math.max(rect.width, 0.01) // can't properly compute scale if width is 0
			: 1
		const x = this.#prevRect![this.justify] - rect[this.justify]

		this.#animation = this.el.animate(
			{
				transform: [`translateX(${x}px) scaleX(${scale})`, 'none']
			},
			{
				duration: 1000,
				easing:
					'linear(0, 0.0008 0.4%, 0.0051 1%, 0.0189 2%, 0.0446, 0.0778 4.39%, 0.1585 6.79%, 0.3699 12.38%, 0.4693 15.17%, 0.5706 18.36%, 0.6521 21.36%, 0.7249, 0.7844 27.75%, 0.8349 31.14%, 0.8571 32.94%, 0.8785, 0.8969 36.93%, 0.9142 39.12%, 0.9298, 0.9428 43.91%, 0.9542, 0.9635 49.1%, 0.9788 55.29%, 0.9887 62.28%, 0.9949 71.06%, 0.9982 82.44%, 0.9997 99.8%)'
			}
		)
		if (scale !== 1) {
			// Invert the scale on the inner element:
			this.#innerAnimation = this.#inner?.animate(
				{
					// 1/x isn't linear so we need to do sampling:
					transform: frames(1000, (t) => `scaleX(${1 / lerp(scale, 1, t)})`)
				},
				{
					duration: 1000,
					easing:
						'linear(0, 0.0008 0.4%, 0.0051 1%, 0.0189 2%, 0.0446, 0.0778 4.39%, 0.1585 6.79%, 0.3699 12.38%, 0.4693 15.17%, 0.5706 18.36%, 0.6521 21.36%, 0.7249, 0.7844 27.75%, 0.8349 31.14%, 0.8571 32.94%, 0.8785, 0.8969 36.93%, 0.9142 39.12%, 0.9298, 0.9428 43.91%, 0.9542, 0.9635 49.1%, 0.9788 55.29%, 0.9887 62.28%, 0.9949 71.06%, 0.9982 82.44%, 0.9997 99.8%)'
				}
			)

			if (this.masked) {
				this.#maskAnimation = this.el.animate(
					discreteFrames(
						1000,
						(t): DiscreteKeyframeProps => ({
							'--_number-flow-scale-x': lerp(scale, 1, t)
						})
					),
					{
						duration: 1000,
						easing:
							'linear(0, 0.0008 0.4%, 0.0051 1%, 0.0189 2%, 0.0446, 0.0778 4.39%, 0.1585 6.79%, 0.3699 12.38%, 0.4693 15.17%, 0.5706 18.36%, 0.6521 21.36%, 0.7249, 0.7844 27.75%, 0.8349 31.14%, 0.8571 32.94%, 0.8785, 0.8969 36.93%, 0.9142 39.12%, 0.9298, 0.9428 43.91%, 0.9542, 0.9635 49.1%, 0.9788 55.29%, 0.9887 62.28%, 0.9949 71.06%, 0.9982 82.44%, 0.9997 99.8%)'
					}
				)
			}
		}
	}
}

abstract class Char<P extends KeyedNumberPart = KeyedNumberPart> {
	constructor(
		readonly section: Section,
		protected value: P['value'],
		readonly el: HTMLSpanElement
	) {}

	abstract willUpdate(parentRect: DOMRect): void
	abstract update(value: P['value']): void
	abstract didUpdate(parentRect: DOMRect): void
}

class Digit extends Char<KeyedDigitPart> {
	constructor(
		section: Section,
		private type: KeyedDigitPart['type'],
		value: KeyedDigitPart['value'],
		className?: string
	) {
		super(
			section,
			value,
			createElement('span', {
				className: `digit ${className ?? ''}`,
				part: `digit ${type} ${value}`,
				textContent: value + ''
			})
		)
	}

	#prevValue?: KeyedDigitPart['value']
	// Relative to parent:
	#prevY?: number
	#prevCenter?: number

	willUpdate(parentRect: DOMRect) {
		this.#prevValue = this.value
		const rect = this.el.getBoundingClientRect()
		this.#prevY = rect.y - parentRect.y
		const prevOffset = rect[this.section.justify] - parentRect[this.section.justify]
		const halfWidth = rect.width / 2
		this.#prevCenter =
			this.section.justify === 'left' ? prevOffset + halfWidth : prevOffset - halfWidth
	}

	update(value: KeyedDigitPart['value']) {
		this.value = value

		if (this.#prevValue !== value) {
			// @ts-expect-error wrong built-in DOM types
			this.el.part = `digit ${this.type} ${value}`

			// We need all the digits, in case of interruptions:
			replaceChildren(this.el, [
				...(value === 0
					? []
					: [
							createElement(
								'span',
								{ className: 'digit__stack digit__lt' },
								Array.from({ length: value }, (_, i) =>
									createElement('span', { textContent: i + '' })
								)
							)
						]),
				document.createTextNode(value + ''),
				...(value === 9
					? []
					: [
							createElement(
								'span',
								{ className: 'digit__stack digit__gt' },
								Array.from({ length: 9 - value }, (_, i) =>
									createElement('span', { textContent: value + i + 1 + '' })
								)
							)
						])
			])
		}
	}

	#xAnimation?: Animation
	#yAnimation?: Animation

	didUpdate(parentRect: DOMRect) {
		// Cancel any previous animations before getting the new rect:
		this.#xAnimation?.cancel()
		if (this.#prevValue !== this.value) this.#yAnimation?.cancel()
		const rect = this.el.getBoundingClientRect()
		const offset = rect[this.section.justify] - parentRect[this.section.justify]
		const halfWidth = rect.width / 2
		const center = this.section.justify === 'left' ? offset + halfWidth : offset - halfWidth

		if (this.#prevValue !== this.value) {
			this.#yAnimation = this.el.animate(
				{
					// Add the offset between the prev top and current parent top to account for interruptions:
					transform: [
						`translateY(calc((100% + ${maskHeight}) * ${this.value - this.#prevValue!} + ${this.#prevY!}px))`,
						'none'
					]
				},
				{
					duration: 1000,
					easing:
						'linear(0, 0.0008 0.4%, 0.0051 1%, 0.0189 2%, 0.0446, 0.0778 4.39%, 0.1585 6.79%, 0.3699 12.38%, 0.4693 15.17%, 0.5706 18.36%, 0.6521 21.36%, 0.7249, 0.7844 27.75%, 0.8349 31.14%, 0.8571 32.94%, 0.8785, 0.8969 36.93%, 0.9142 39.12%, 0.9298, 0.9428 43.91%, 0.9542, 0.9635 49.1%, 0.9788 55.29%, 0.9887 62.28%, 0.9949 71.06%, 0.9982 82.44%, 0.9997 99.8%)'
				}
			)
		}
		this.#xAnimation = this.el.animate(
			{
				transform: [`translateX(${this.#prevCenter! - center}px)`, 'none']
			},
			{
				duration: 1000,
				composite: 'accumulate',
				easing:
					'linear(0, 0.0008 0.4%, 0.0051 1%, 0.0189 2%, 0.0446, 0.0778 4.39%, 0.1585 6.79%, 0.3699 12.38%, 0.4693 15.17%, 0.5706 18.36%, 0.6521 21.36%, 0.7249, 0.7844 27.75%, 0.8349 31.14%, 0.8571 32.94%, 0.8785, 0.8969 36.93%, 0.9142 39.12%, 0.9298, 0.9428 43.91%, 0.9542, 0.9635 49.1%, 0.9788 55.29%, 0.9887 62.28%, 0.9949 71.06%, 0.9982 82.44%, 0.9997 99.8%)'
			}
		)
	}
}

class Sym extends Char<KeyedSymbolPart> {
	constructor(
		section: Section,
		private type: KeyedSymbolPart['type'],
		value: KeyedSymbolPart['value'],
		className?: string
	) {
		super(
			section,
			value,
			createElement('span', {
				className: `symbol ${className ?? ''}`,
				part: `symbol ${type}`,
				textContent: value
			})
		)
	}

	#prevOffset?: number

	willUpdate(parentRect: DOMRect) {
		if (this.type === 'decimal') return // decimal never needs animation b/c it's the first in a left aligned section and never moves
		const rect = this.el.getBoundingClientRect()
		this.#prevOffset = rect[this.section.justify] - parentRect[this.section.justify]
	}

	update(value: KeyedSymbolPart['value']) {
		this.el.textContent = value
		this.value = value

		// @ts-expect-error wrong built-in DOM types
		this.el.part = `symbol ${this.type} ${value}`
	}

	#xAnimation?: Animation

	didUpdate(parentRect: DOMRect) {
		if (this.type === 'decimal') return
		// Cancel any previous animations before getting the new rect:
		this.#xAnimation?.cancel()
		const rect = this.el.getBoundingClientRect()
		const offset = rect[this.section.justify] - parentRect[this.section.justify]

		this.#xAnimation = this.el.animate(
			{
				transform: [`translateX(${this.#prevOffset! - offset}px)`, 'none']
			},
			{
				duration: 1000,
				easing:
					'linear(0, 0.0008 0.4%, 0.0051 1%, 0.0189 2%, 0.0446, 0.0778 4.39%, 0.1585 6.79%, 0.3699 12.38%, 0.4693 15.17%, 0.5706 18.36%, 0.6521 21.36%, 0.7249, 0.7844 27.75%, 0.8349 31.14%, 0.8571 32.94%, 0.8785, 0.8969 36.93%, 0.9142 39.12%, 0.9298, 0.9428 43.91%, 0.9542, 0.9635 49.1%, 0.9788 55.29%, 0.9887 62.28%, 0.9949 71.06%, 0.9982 82.44%, 0.9997 99.8%)'
			}
		)
	}
}

export default NumberFlow

if (BROWSER && !customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
