import { define } from './util/dom'
import { ServerSafeHTMLElement } from './ssr'
import { CONNECT_EVENT, UPDATE_EVENT } from '.'
import NumberFlow from '.'

export default class NumberFlowGroup extends ServerSafeHTMLElement {
	private _mutationObserver?: MutationObserver
	private _flows = new Set<NumberFlow>()

	connectedCallback() {
		// The descendants are probably already connected, so query the DOM first.
		// Note: this won't work with a custom-defined element, if that ever exists:
		this.querySelectorAll<NumberFlow>('number-flow').forEach((flow) => {
			this._flows.add(flow)
		})

		this.addEventListener(CONNECT_EVENT, this._onDescendantConnected)
		this.addEventListener(UPDATE_EVENT, this._onDescendantUpdate)

		// We can't emit disconnection events, so use a mutation observer to track those
		this._mutationObserver ??= new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.removedNodes.forEach((node) => {
					if (node instanceof NumberFlow) {
						this._flows.delete(node)
					}
				})
			})
		})
		this._mutationObserver.observe(this, { childList: true, subtree: true })
	}

	private _onDescendantConnected = (event: Event) => {
		this._flows.add(event.target as NumberFlow)
	}

	// When any descendant updates, transition all of them together. willUpdate
	// batches every member's reads and writes into the shared frame (deduped),
	// which gets applied at the end of the task, after every member's update
	// has joined it:
	private _onDescendantUpdate = () => {
		const flows = [...this._flows].filter((flow) => flow.created)
		flows.forEach((flow) => flow.willUpdate())
		queueMicrotask(() => {
			flows.forEach((flow) => flow.didUpdate())
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
