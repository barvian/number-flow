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

	// Convenience for updating all sections:
	#sections: Section[] = []

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

			this.#sections.push(
				(this.#pre = new Section(this, pre, {
					part: 'pre',
					inert: true,
					ariaHidden: 'true',
					justify: 'right',
					exitMode: 'pop'
				}))
			)
			this.shadowRoot!.appendChild(this.#pre.el)
			this.#sections.push(
				(this.#integer = new Section(this, integer, {
					part: 'integer',
					inert: true,
					masked: true,
					ariaHidden: 'true',
					justify: 'right',
					exitMode: 'sync'
				}))
			)
			this.shadowRoot!.appendChild(this.#integer.el)
			this.#sections.push(
				(this.#fraction = new Section(this, fraction, {
					part: 'fraction',
					inert: true,
					masked: true,
					ariaHidden: 'true',
					justify: 'left',
					exitMode: 'sync'
				}))
			)
			this.shadowRoot!.appendChild(this.#fraction.el)
			this.#sections.push(
				(this.#post = new Section(this, post, {
					part: 'post',
					inert: true,
					ariaHidden: 'true',
					justify: 'left',
					exitMode: 'pop'
				}))
			)
			this.shadowRoot!.appendChild(this.#post.el)
		} else {
			// Update otherwise
			scopeRaf(this, () => {
				this.#sections.forEach((section) => section.willUpdate())

				this.#pre!.update(pre)
				this.#integer!.update(integer)
				this.#fraction!.update(fraction)
				this.#post!.update(post)

				this.#sections.forEach((section) => section.didUpdate())
			})
		}

		this.#label!.textContent = formatted

		this.#formatted = formatted
		this.#created = true
	}

	disconnectedCallback() {
		// Cancel any pending animation frames:
		getRafs(this)?.forEach((id) => cancelAnimationFrame(id))
	}
}

type Justify = 'left' | 'right'
type ExitMode = 'sync' | 'pop'

class Section {
	readonly el: HTMLDivElement
	readonly #inner: HTMLDivElement
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

	rect?: DOMRect
	innerRect?: DOMRect

	willUpdate() {
		this.rect = this.el.getBoundingClientRect()
		this.innerRect = this.#inner.getBoundingClientRect()
	}

	update(parts: KeyedNumberPart[]) {
		const updates: (() => void)[] = []

		// Mark removed children before updates
		this.#children.forEach((comp, key) => {
			if (!parts.find((p) => p.key === key)) {
				comp.el.classList.add('section__exiting')
				// Exiting digits should always be set to 0 for mathematical correctness:
				if (comp instanceof Digit) updates.push(() => comp.update(0))
			}
		})

		// Add new parts before updates
		const reverse = this.justify === 'right'
		const addOp = reverse ? 'prepend' : 'append'
		forEach(parts, reverse, (part) => {
			// If this child already exists, update it:
			if (this.#children.has(part.key)) {
				const comp = this.#children.get(part.key)!
				comp.el.classList.remove('section__exiting')
				// TODO: I think this is wrong:
				updates.push(() => comp.update(part.value))
			} else {
				// Otherwise, create a new one:
				const comp: Char =
					part.type === 'integer' || part.type === 'fraction'
						? new Digit(this, part.type, 0) // always start at 0 for mathematical correctness
						: new Sym(this, part.type, part.value)
				updates.push(() => comp.update(part.value))
				this.#children.set(part.key, comp)

				this.#inner[addOp](comp.el)
			}
		})

		// Mark all for update
		this.#children.forEach((comp) => comp.willUpdate())

		// And finally update everything
		updates.forEach((fn) => fn())
	}

	didUpdate() {
		const newRect = this.el.getBoundingClientRect()
		const newInnerRect = this.#inner.getBoundingClientRect()

		raf(() => {})

		this.#children.forEach((comp) => comp.didUpdate())
	}
}

abstract class Char<P extends KeyedNumberPart = KeyedNumberPart> {
	constructor(
		readonly section: Section,
		protected _value: P['value'],
		readonly el: HTMLSpanElement
	) {}

	abstract willUpdate(): void
	abstract update(value: P['value']): void
	abstract didUpdate(): void
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

	#prevValue: KeyedDigitPart['value'] | undefined
	#prevRect: DOMRect | undefined

	willUpdate() {
		// TODO: might be able to optimize this b/c it's relative i.e. if (!this.#prevRect)
		this.#prevRect = this.el.getBoundingClientRect()
	}

	update(value: KeyedDigitPart['value']) {
		this.#prevValue = this._value
		this._value = value

		if (this.#prevValue !== value) {
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
	}

	#xAnimation?: Animation
	#yAnimation?: Animation

	didUpdate() {
		raf(() => {
			// Cancel any previous animations before getting the new rect:
			this.#xAnimation?.cancel()
			this.#yAnimation?.cancel()
			const rect = this.el.getBoundingClientRect()
			const parentRect = this.section.innerRect!

			// Animate y if value updated
			if (this.#prevValue !== this._value) {
				this.#yAnimation = this.el.animate(
					{
						// Add the offset between the prev top and current parent top to account for interruptions:
						transform: [
							`translateY(calc((100% + ${maskHeight}) * ${this._value - this.#prevValue!} + ${this.#prevRect!.y - parentRect.y}px))`,
							'none'
						]
					},
					{
						duration: 1000,
						easing:
							'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
					}
				)
			}
			this.#xAnimation = this.el.animate(
				{
					transform: [
						`translateX(${this.#prevRect!.x + this.#prevRect!.width / 2 - (rect.x + rect.width / 2)}px)`,
						'none'
					]
				},
				{
					duration: 1000,
					composite: 'accumulate',
					easing:
						'linear(0, 0.005, 0.02 2.3%, 0.082, 0.16 7.7%, 0.462 16.9%, 0.557, 0.637, 0.707,0.767 30.2%, 0.818, 0.861 37.5%, 0.899 42%, 0.93 46.9%, 0.954 52.4%,0.972 58.7%, 0.984 65.7%, 0.992 74.3%, 0.997 85%, 0.999)'
				}
			)

			// TODO: might help optimize slightly
			// this.#prevRect = rect
		})
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

	willUpdate() {}

	update(value: KeyedSymbolPart['value']) {
		this.el.textContent = value
		this._value = value

		// @ts-expect-error wrong built-in DOM types
		this.el.part = `symbol ${this.type} ${value}`
	}

	didUpdate() {}
}

export default NumberFlow

if (NumberFlow && typeof window !== 'undefined' && !window.customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
