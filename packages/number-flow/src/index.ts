import { createElement, ServerSafeHTMLElement } from './dom'
import {
	formatToParts,
	type KeyedDigitPart,
	type KeyedNumberPart,
	type KeyedSymbolPart,
	type Format,
	type Value
} from './formatter'
import styles from './styles'

export type * from './formatter'

const OBSERVED_ATTRIBUTES = ['transition'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]

const DEFAULT_TRANSITION: KeyframeAnimationOptions = {
	duration: 1
}

type Args = Value | [Value, locales?: Intl.LocalesArgument, format?: Format]

let styleSheet: CSSStyleSheet | undefined

class NumberFlow extends ServerSafeHTMLElement {
	static observedAttributes = OBSERVED_ATTRIBUTES

	#internals: ElementInternals
	transition = DEFAULT_TRANSITION
	#formatted?: string

	attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string) {
		this[attr] = JSON.parse(newValue)
	}

	get value(): string | undefined {
		return this.#formatted
	}

	set value(newVal: Args | undefined) {
		if (newVal == null) {
			this.#formatted = undefined
			this.#internals.ariaLabel = null
			return
		}
		const { pre, integer, fraction, post, formatted } = Array.isArray(newVal)
			? formatToParts(...newVal)
			: formatToParts(newVal)

		this.#formatted = formatted
		this.#internals.ariaLabel = formatted
	}

	constructor() {
		super()
		// Don't check for declarative shadow DOM because we'll recreate it anyway:
		this.attachShadow({ mode: 'open' })
		this.#internals = this.attachInternals()
	}

	#pre?: Section
	#integer?: Section
	#fraction?: Section
	#post?: Section
	connectedCallback() {
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

		this.#pre = new Section(this, 'pre')
		this.shadowRoot!.appendChild(this.#pre.el)
		this.#integer = new Section(this, 'integer')
		this.shadowRoot!.appendChild(this.#integer.el)
		this.#fraction = new Section(this, 'fraction')
		this.shadowRoot!.appendChild(this.#fraction.el)
		this.#post = new Section(this, 'post')
		this.shadowRoot!.appendChild(this.#post.el)
	}
}

class Section {
	readonly el: HTMLDivElement

	constructor(
		private flow: NumberFlow,
		part: string
	) {
		this.el = createElement('div', { part })
	}

	#children: Map<string, Digit | Sym> = new Map()
	set value(value: KeyedNumberPart[]) {
		// Mark all existing children as exiting:
		// this.#children.forEach((char) => (char.exiting = true))
		value.forEach((char) => {
			if (this.#children.has(char.key)) {
				// this.#children.get(char.key)!.value = char.value
			}
		})
	}
}

class Digit {
	readonly el: HTMLSpanElement

	constructor(
		private flow: NumberFlow,
		private section: Section
	) {
		this.el = createElement('span', { part: 'digit' })
	}

	set value(value: KeyedDigitPart) {}
}

class Sym {
	readonly el: HTMLSpanElement

	constructor(
		private flow: NumberFlow,
		private section: Section
	) {
		this.el = createElement('span', { part: 'symbol' })
	}

	set value(value: KeyedSymbolPart) {}
}

export default NumberFlow

if (NumberFlow && typeof window !== 'undefined' && !window.customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
