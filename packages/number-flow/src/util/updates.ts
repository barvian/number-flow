type UpdateFn = () => void

const _preRead: UpdateFn[] = [], _read: UpdateFn[] = [], _postRead: UpdateFn[] = []

export function preRead(fn: UpdateFn) {
	_preRead.push(fn)
}

export function read(fn: UpdateFn) {
	_read.push(fn)
}

export function postRead(fn: UpdateFn) {
	_postRead.push(fn)
}

export function flush() {
	_preRead.forEach((fn) => fn())
	_read.forEach((fn) => fn())
	_postRead.forEach((fn) => fn())
}