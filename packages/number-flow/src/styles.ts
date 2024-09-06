// Build the mask for the numbers. Technique taken from:
// https://expensive.toys/blog/blur-vignette
const maskHeight = 'var(--mask-height, 0.15em)'
const maskWidth = 'var(--mask-width, 0.5em)'
const correctedMaskWidth = `calc(${maskWidth} / var(--scale-x-correction, 1))`
const cornerGradient = `#000 0, transparent 71%` // or transparent ${maskWidth}
const mask =
	// Horizontal:
	`linear-gradient(to right, transparent 0, #000 ${correctedMaskWidth}, #000 calc(100% - ${correctedMaskWidth}), transparent),` +
	// Vertical:
	`linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%),` +
	// TL corner
	`radial-gradient(at bottom right, ${cornerGradient}),` +
	// TR corner
	`radial-gradient(at bottom left, ${cornerGradient}), ` +
	// BR corner
	`radial-gradient(at top left, ${cornerGradient}), ` +
	// BL corner
	`radial-gradient(at top right, ${cornerGradient})`
const maskSize =
	`100% calc(100% - ${maskHeight} * 2),` +
	`calc(100% - ${correctedMaskWidth} * 2) 100%,` +
	`${correctedMaskWidth} ${maskHeight},` +
	`${correctedMaskWidth} ${maskHeight},` +
	`${correctedMaskWidth} ${maskHeight},` +
	`${correctedMaskWidth} ${maskHeight}`
