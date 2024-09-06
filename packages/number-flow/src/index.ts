import { createElement, ServerSafeHTMLElement } from './dom'
import { formatToParts, type NumberFormatOptions, type Value } from './formatter'
import styles from './styles'

const OBSERVED_ATTRIBUTES = ['value', 'transition'] as const
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number]

const DEFAULT_TRANSITION: KeyframeAnimationOptions = {
	duration: 1
}

type Args = Value | [Value, locales?: Intl.LocalesArgument, format?: NumberFormatOptions]

let styleSheet: CSSStyleSheet | undefined

class NumberFlow extends ServerSafeHTMLElement {
	static observedAttributes = OBSERVED_ATTRIBUTES

	transition = DEFAULT_TRANSITION
	#formatted?: string

	attributeChangedCallback(attr: ObservedAttribute, _: string, newValue: string) {
		this[attr] = JSON.parse(newValue)
	}

	get value(): string | undefined {
		return this.#formatted
	}

	set value(newVal: Args | undefined) {
		if (newVal == null) {
			this.#formatted = undefined
			return
		}
		const { pre, integer, fraction, post, formatted } = Array.isArray(newVal)
			? formatToParts(...newVal)
			: formatToParts(newVal)

		this.#formatted = formatted
	}

	constructor() {
		super()
		// Don't check for declarative shadow DOM because we'll recreate it anyway:
		this.attachShadow({ mode: 'open' })
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

		this.#pre = new Section(this)
		this.shadowRoot!.appendChild(this.#pre.el)
		this.#integer = new Section(this)
		this.shadowRoot!.appendChild(this.#integer.el)
		this.#fraction = new Section(this)
		this.shadowRoot!.appendChild(this.#fraction.el)
		this.#post = new Section(this)
		this.shadowRoot!.appendChild(this.#post.el)
	}
}

class Section {
	readonly el: HTMLDivElement

	constructor(private flow: NumberFlow) {
		this.el = createElement('div', { part: 'pre' })
	}
}

export default NumberFlow

if (NumberFlow && typeof window !== 'undefined' && !window.customElements.get('number-flow')) {
	customElements.define('number-flow', NumberFlow)
}
