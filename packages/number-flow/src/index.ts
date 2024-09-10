import { createElement, type HTMLProps } from './dom'
import {
	formatToParts,
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type Format,
	type Value
} from './formatter'
import { ServerSafeHTMLElement } from './ssr'
import styles from './styles'
export { renderInnerHTML } from './ssr'
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

		if (!this.#created) {
			// Don't check for declarative shadow DOM because we'll recreate it anyway:
			this.attachShadow({ mode: 'open' })

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

			this.#pre = new Section(this, {
				part: 'pre',
				inert: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'pop'
			})
			this.shadowRoot!.appendChild(this.#pre.el)
			this.#integer = new Section(this, {
				part: 'integer',
				inert: true,
				ariaHidden: 'true',
				justify: 'right',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#integer.el)
			this.#fraction = new Section(this, {
				part: 'fraction',
				inert: true,
				ariaHidden: 'true',
				justify: 'left',
				exitMode: 'sync'
			})
			this.shadowRoot!.appendChild(this.#fraction.el)
			this.#post = new Section(this, {
				part: 'post',
				inert: true,
				ariaHidden: 'true',
				justify: 'left',
				exitMode: 'pop'
			})
			this.shadowRoot!.appendChild(this.#post.el)
		}

		const { pre, integer, fraction, post, formatted } = Array.isArray(newVal)
			? formatToParts(...newVal)
			: formatToParts(newVal)

		this.#label!.textContent = formatted
		this.#pre!.parts = pre
		this.#integer!.parts = integer
		this.#fraction!.parts = fraction
		this.#post!.parts = post

		this.#formatted = formatted
		this.#created = true
	}
}

type Justify = 'left' | 'right'
type ExitMode = 'sync' | 'pop'

class Section {
	readonly el: HTMLDivElement
	#inner: HTMLDivElement
	readonly justify: Justify
	readonly exitMode: ExitMode

	constructor(
		readonly flow: NumberFlow,
		{ justify, exitMode, ...opts }: { justify: Justify; exitMode: ExitMode } & HTMLProps<'section'>
	) {
		this.justify = justify
		this.exitMode = exitMode

		// Zero width space prevents the height from collapsing when no chars:
		this.#inner = createElement('div', { className: 'section__inner', innerHTML: '&#8203;' })
		this.el = createElement('div', { ...opts, className: `section section--justify-${justify}` }, [
			this.#inner
		])
	}

	#children: Map<string, Digit | Sym> = new Map()
	set parts(parts: KeyedNumberPart[]) {
		const len = parts.length
		const right = this.justify === 'right'
		for (let i = right ? len - 1 : 0; right ? i >= 0 : i < len; right ? i-- : i++) {
			const part = parts[i]!

			// If this child already exists, update it:
			if (this.#children.has(part.key)) {
				const comp = this.#children.get(part.key)!
				comp.part = part
			} else {
				// Otherwise, create a new one:
				const comp =
					part.type === 'integer' || part.type === 'fraction' ? new Digit(this) : new Sym(this)
				comp.part = part
				this.#children.set(part.key, comp)

				this.#inner[right ? 'prepend' : 'append'](comp.el)
			}
		}
	}
}

class Digit {
	readonly el: HTMLSpanElement

	constructor(readonly section: Section) {
		this.el = createElement('span', { part: 'digit' })
	}

	set part(part: KeyedDigitPart) {
		this.el.textContent = part.value + ''
	}
}

class Sym {
	readonly el: HTMLSpanElement

	constructor(readonly section: Section) {
		this.el = createElement('span', { part: 'symbol' })
	}

	set part(part: KeyedSymbolPart) {
		this.el.textContent = part.value
	}
}

export default NumberFlow

if (NumberFlow && typeof window !== 'undefined' && !window.customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
