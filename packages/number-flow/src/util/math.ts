// Math.max that handles nullish numbers
export const max = (n1?: number, n2?: number) => {
	if (n1 != null && n2 == null) return n1
	if (n1 == null && n2 != null) return n2
	if (n1 != null && n2 != null) return Math.max(n1, n2)
	return null
}
