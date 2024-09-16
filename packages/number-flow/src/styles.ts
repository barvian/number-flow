// Build the mask for the numbers. Technique taken from:
// https://expensive.toys/blog/blur-vignette
export const maskHeight = 'var(--mask-height, 0.15em)'
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

const styles = `
:host {
	display: inline-flex;
	direction: ltr;
	position: relative;
	isolation: isolate;
	user-select: none;
	pointer-events: none;
}

.label {
	position: absolute;
	left: 0;
	top: 0;
	font-kerning: none;
	color: transparent !important;
	z-index: -1;
	user-select: text;
	pointer-events: auto;
}

.section {
	display: inline-flex;
	user-select: none;
}

.section__inner {
	display: inline-flex;
	justify-content: inherit;
	/* for .section__exiting: */
	position: relative; 
	isolation: isolate;
}

.section--justify-left {
	justify-content: left;
	transform-origin: center left;
}

	.section--justify-left .section__inner {
		transform-origin: center left;
	}

.section--justify-right {
	justify-content: right;
	transform-origin: center right;
}

	.section--justify-right .section__inner {
		transform-origin: center right;
	}

.section--masked {
	overflow: clip;
}

	.section--masked.section--justify-left {
		padding-right: ${maskWidth};
		margin-right: calc(-1 * ${maskWidth});
	}

	.section--masked.section--justify-right {
		padding-left: ${maskWidth};
		margin-left: calc(-1 * ${maskWidth});
	}

.section__exiting {
	position: absolute !important;
	z-index: -1;
	top: 0;
	opacity: 0;
}

.digit {
	display: inline-block;
	position: relative;
}

.digit__stack {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${maskHeight};
	position: absolute;
	width: 100%;
}

.digit__stack > * {
	display: inline-block;
}

.digit__lt {
	bottom: calc(100% + ${maskHeight});
}

.digit__gt {
	top: calc(100% + ${maskHeight});
}
`

export default styles
