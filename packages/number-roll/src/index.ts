import numberRollStyles from './number-roll.css?raw'

const addStyle = (shadowRoot: ShadowRoot, styles: string) => {
	if (typeof CSSStyleSheet !== 'undefined' && shadowRoot.adoptedStyleSheets) {
		const styleSheet = new CSSStyleSheet()
		styleSheet.replaceSync(styles)
		shadowRoot.adoptedStyleSheets = [styleSheet]
	} else {
		const style = document.createElement('style')
		style.setAttribute('rel', 'stylesheet')
		style.textContent = styles
		shadowRoot.appendChild(style)
	}
}

export const NumberRoll = (() => {
	if (typeof window === 'undefined' || typeof HTMLElement === 'undefined') return
	return class NumberRoll extends HTMLElement {
		constructor() {
			super()
			this.attachShadow({ mode: 'open' })
		}

		#initialized = false

		connectedCallback() {
			if (this.#initialized || !this.shadowRoot) return

			addStyle(this.shadowRoot, numberRollStyles)
			this.shadowRoot.innerHTML = `<slot></slot>`

			this.#initialized = true
		}
	}
})()

export const define = () => {
	if (typeof window !== 'undefined' && NumberRoll && !window.customElements.get('number-roll')) {
		customElements.define('number-roll', NumberRoll)
	}
}
