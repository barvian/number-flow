// Fix types for Intl.NumberFormat
declare namespace Intl {
	interface NumberFormat {
		formatToParts(number?: number | bigint | string): NumberFormatPart[]
	}
}
