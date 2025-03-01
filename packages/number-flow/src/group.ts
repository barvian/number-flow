import { define } from './util/dom'
import { ServerSafeHTMLElement } from './ssr'
import { CONNECT_EVENT, UPDATE_EVENT } from '.'
import NumberFlow from '.'

export default class NumberFlowGroup extends ServerSafeHTMLElement {
	private _mutationObserver?: MutationObserver

	connectedCallback() {
		// The descendants are probably already connected, so query the DOM first.
		// Note: this won't work with a custom-defined element, if that ever exists:
		this.querySelectorAll<NumberFlow>('number-flow').forEach((flow) => {
			this._addDescendant(flow)
		})

		this.addEventListener(CONNECT_EVENT, this._onDescendantConnected)
		this.addEventListener(UPDATE_EVENT, this._onDescendantUpdate)

		// We can't emit disconnection events, so use a mutation observer to track those
		this._mutationObserver ??= new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.removedNodes.forEach((node) => {
					if (node instanceof NumberFlow) {
						this._removeDescendant(node)
					}
				})
			})
		})
		this._mutationObserver.observe(this, { childList: true, subtree: true })
	}

	private _flows = new Set<NumberFlow>()

	_addDescendant = (flow: NumberFlow) => {
		flow.manual = true
		this._flows.add(flow)
	}
	_removeDescendant = (flow: NumberFlow) => {
		flow.manual = false
		this._flows.delete(flow)
	}

	private _onDescendantConnected = (event: Event) => {
		this._addDescendant(event.target as NumberFlow)
	}

	private _updating = false
	private _onDescendantUpdate = () => {
		if (this._updating) return
		this._updating = true
		this._flows.forEach((flow) => {
			if (!flow.created) return
			flow.willUpdate()
			queueMicrotask(() => {
				if (flow.connected) flow.didUpdate()
			})
		})
		queueMicrotask(() => {
			this._updating = false
		})
	}

	disconnectedCallback() {
		this.removeEventListener(CONNECT_EVENT, this._onDescendantConnected)
		this.removeEventListener(UPDATE_EVENT, this._onDescendantUpdate)
		this._mutationObserver?.disconnect()
	}
}

define('number-flow-group', NumberFlowGroup)

declare global {
	interface HTMLElementTagNameMap {
		'number-flow-group': NumberFlowGroup
	}
}
