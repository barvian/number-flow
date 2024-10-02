export const getBefore = (node: Node) => {
	const before: ChildNode[] = []
	for (let prev = node.previousSibling; prev; prev = prev.previousSibling) {
		before.unshift(prev)
	}
	return before
}

export const getAfter = (node: Node) => {
	const after: ChildNode[] = []
	for (let next = node.nextSibling; next; next = next.nextSibling) {
		after.push(next)
	}
	return after
}
