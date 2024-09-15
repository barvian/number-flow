import { createElement, replaceChildren, type HTMLProps } from './util/dom'
import { forEach } from './util/iterable'
import {
	formatToParts,
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type Format,
	type Value
} from './formatter'
import { ServerSafeHTMLElement } from './ssr'
import styles, { maskHeight } from './styles'
export { renderInnerHTML } from './ssr'
import raf, { getRafs, scopeRaf } from './util/raf'
export type * from './formatter'

const OBSERVED_ATTRIBUTES = ['value', 'timing'] as const
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

	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
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
			scopeRaf(this, () => {
				// Update otherwise:
				const sectionFlips: ReturnType<(typeof Section)['prototype']['update']>[] = []
				sectionFlips.push(this.#pre!.update(pre))
				sectionFlips.push(this.#integer!.update(integer))
				sectionFlips.push(this.#fraction!.update(fraction))
				sectionFlips.push(this.#post!.update(post))
				sectionFlips.forEach((flip) => flip())
			})
		}

		this.#label!.textContent = formatted

		this.#formatted = formatted
		this.#created = true
	}

	disconnectedCallback() {
		// Cancel any requested animation frames:
		getRafs(this)?.forEach((id) => cancelAnimationFrame(id))
	}
}

type Justify = 'left' | 'right'
type ExitMode = 'sync' | 'pop'

class Section {
	readonly el: HTMLDivElement
	#inner: HTMLDivElement
	readonly justify: Justify
	readonly exitMode: ExitMode
	readonly masked: boolean

	// All children in the DOM:
	#children: Map<string, Char>

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

		this.#inner = createElement(
			'div',
			{
				className: 'section__inner',
				// Zero width space prevents the height from collapsing when no chars:
				innerHTML: '&#8203;'
			},
			parts.map((part) => {
				const comp =
					part.type === 'integer' || part.type === 'fraction'
						? new Digit(this, part.type, part.value)
						: new Sym(this, part.type, part.value)
				this.#children.set(part.key, comp)
				return comp.el
			})
		)

		this.el = createElement(
			'div',
			{
				...opts,
				className: `section section--justify-${justify}${masked ? ' section--masked' : ''}`
			},
			[this.#inner]
		)
	}

	update(parts: KeyedNumberPart[]) {
		const rect = this.el.getBoundingClientRect()
		const innerRect = this.#inner.getBoundingClientRect()

		const charFlips: ReturnType<(typeof Char)['prototype']['update']>[] = []

		// Find removed children
		this.#children.forEach((comp, key) => {
			if (!parts.find((p) => p.key === key)) {
				comp.el.classList.add('section__exiting')
				// Exiting digits should always be set to 0 for mathematical correctness:
				if (comp instanceof Digit) charFlips.push(comp.update(0))
			}
		})

		// Add or update other parts:
		const reverse = this.justify === 'right'
		const addOp = reverse ? 'prepend' : 'append'
		forEach(parts, reverse, (part) => {
			// If this child already exists, update it:
			if (this.#children.has(part.key)) {
				const comp = this.#children.get(part.key)!
				comp.el.classList.remove('section__exiting')
				charFlips.push(comp.update(part.value))
			} else {
				// Otherwise, create a new one:
				const comp: Char =
					part.type === 'integer' || part.type === 'fraction'
						? new Digit(this, part.type, 0) // always start at 0 for mathematical correctness
						: new Sym(this, part.type, part.value)
				charFlips.push(comp.update(part.value))
				this.#children.set(part.key, comp)

				this.#inner[addOp](comp.el)
			}
		})

		return () => {
			const newInnerRect = this.#inner.getBoundingClientRect()

			charFlips.forEach((flip) => flip(newInnerRect))
		}
	}
}

abstract class Char<P extends KeyedNumberPart = KeyedNumberPart> {
	constructor(
		readonly section: Section,
		protected _value: P['value'],
		readonly el: HTMLSpanElement
	) {}

	abstract update(value: P['value']): (parentRect: DOMRect) => void
}

class Digit extends Char<KeyedDigitPart> {
	constructor(
		section: Section,
		private type: KeyedDigitPart['type'],
		value: KeyedDigitPart['value']
	) {
		super(
			section,
			value,
			createElement('span', { className: 'digit', part: `digit ${type}`, textContent: value + '' })
		)
	}

	#updated = false
	#yAnimation?: Animation

	update(value: KeyedDigitPart['value']) {
		const prevVal = this._value

		if (prevVal !== value) {
			// @ts-expect-error wrong built-in DOM types
			this.el.part = `digit ${this.type} ${value}`

			replaceChildren(this.el, [
				...(value === 0
					? []
					: [
							createElement(
								'span',
								{ className: 'digit__stack digit__lt' },
								new Array(value)
									.fill(null)
									.map((_, i) =>
										createElement('span', { className: 'digit__digit', textContent: i + '' })
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
								new Array(9 - value).fill(null).map((_, i) =>
									createElement('span', {
										className: 'digit__digit',
										textContent: value + i + 1 + ''
									})
								)
							)
						])
			])
		}

		this._value = value
		const prevRect = this.el.getBoundingClientRect()

		return (parentRect: DOMRect) => {
			// Cancel the previous animation if it exists before getting the new rect:
			this.#yAnimation?.cancel()
			const rect = this.el.getBoundingClientRect()

			// Animate y if value updated
			if (prevVal !== value) {
				raf(() => {
					this.#yAnimation = this.el.animate(
						{
							// Add the offset between the prev top and current parent top to account for interruptions:
							transform: [
								`translateY(calc((100% + ${maskHeight}) * ${value - prevVal} + ${prevRect.y - parentRect.y}px))`,
								'none'
							]
						},
						{
							duration: 1660,
							easing:
								'linear(0, 0.001 0.44%, 0.0045 0.94%, 0.0195 2.03%, 0.0446 3.19%, 0.0811 4.5%, 0.1598 6.82%, 0.3685 12.34%, 0.4693 15.17%, 0.5663, 0.6498 21.27%, 0.7215 24.39%, 0.7532 25.98%, 0.7829 27.65%, 0.8105, 0.8349 31.14%, 0.8573 32.95%, 0.8776 34.84%, 0.8964 36.87%, 0.9136 39.05%, 0.929 41.37%, 0.9421 43.77%, 0.9537 46.38%, 0.9636 49.14%, 0.9789 55.31%, 0.9888 62.35%, 0.9949 71.06%, 0.9982 82.52%, 0.9997 99.94%)'
						}
					)
				})
			}
		}
	}
}

class Sym extends Char<KeyedSymbolPart> {
	constructor(
		section: Section,
		private type: KeyedSymbolPart['type'],
		value: KeyedSymbolPart['value']
	) {
		super(section, value, createElement('span', { part: `symbol ${type}`, textContent: value }))
	}

	update(value: KeyedSymbolPart['value']) {
		this.el.textContent = value
		this._value = value

		// @ts-expect-error wrong built-in DOM types
		this.el.part = `symbol ${this.type} ${value}`

		return (parentRect: DOMRect) => {}
	}
}

export default NumberFlow

if (NumberFlow && typeof window !== 'undefined' && !window.customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
