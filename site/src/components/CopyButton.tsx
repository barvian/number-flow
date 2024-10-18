import * as React from 'react'
import { Check, Clipboard } from 'lucide-react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import clsx from 'clsx/lite'

export default function CopyButton({
	value,
	className,
	...rest
}: JSX.IntrinsicElements['button'] & { value: string }) {
	const [copied, setCopied] = React.useState(false)
	const handleClick = async () => {
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
		} catch {}
	}

	React.useEffect(() => {
		if (copied) {
			setTimeout(() => setCopied(false), 2000)
		}
	}, [copied])

	return (
		<button
			{...rest}
			aria-label="Copy to clipboard"
			className={clsx(className, 'overlap btn btn-secondary btn-icon')}
			onClick={handleClick}
		>
			<MotionConfig transition={{ duration: 0.3 }}>
				<AnimatePresence initial={false}>
					{copied ? (
						<motion.span
							className="block"
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
						>
							<Check className="size-4" absoluteStrokeWidth strokeWidth={3} />
						</motion.span>
					) : (
						<motion.span
							className="block"
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
						>
							<Clipboard className="relative -top-[0.0625em] size-4" absoluteStrokeWidth />
						</motion.span>
					)}
				</AnimatePresence>
			</MotionConfig>
		</button>
	)
}
