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
import clsx from 'clsx/lite'

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

			this.#pre = new Section(this, { part: 'pre', justify: 'right', exitMode: 'pop' })
			this.shadowRoot!.appendChild(this.#pre.el)
			this.#integer = new Section(this, { part: 'integer', justify: 'right', exitMode: 'sync' })
			this.shadowRoot!.appendChild(this.#integer.el)
			this.#fraction = new Section(this, { part: 'fraction', justify: 'left', exitMode: 'sync' })
			this.shadowRoot!.appendChild(this.#fraction.el)
			this.#post = new Section(this, { part: 'post', justify: 'left', exitMode: 'pop' })
			this.shadowRoot!.appendChild(this.#post.el)
		}

		const { pre, integer, fraction, post, formatted } = Array.isArray(newVal)
			? formatToParts(...newVal)
			: formatToParts(newVal)

		this.#label!.textContent = this.#formatted = formatted

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
		private flow: NumberFlow,
		{
			justify,
			exitMode,
			className,
			...opts
		}: { justify: Justify; exitMode: ExitMode } & HTMLProps<'section'>
	) {
		this.justify = justify
		this.exitMode = exitMode

		this.#inner = createElement('div', { className: 'section__inner' })
		this.el = createElement(
			'div',
			{ ...opts, className: clsx(className, `section section--justify-${justify}`) },
			[this.#inner]
		)
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
