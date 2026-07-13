// A tiny function queue inspired by Motion's frame loop:
// https://motion.dev/docs/frame
// Jobs are grouped into sequential steps that alternate between DOM writes
// and reads, and flushed together via flush() — synchronously at the end of
// a standalone update, by a framework wrapper's didUpdate() after its
// commit, or by <number-flow-group>'s end-of-task microtask. Because every
// write is queued here, willUpdate's reads can run synchronously ahead of
// them, and all reads and writes stay batched across every NumberFlow in
// the batch — preventing layout thrashing no matter how many flows update
// at once.

type Job = () => void

const queues: Set<Job>[] = []

const step = () => {
	// Sets dedupe jobs, so scheduling the same (bound) method twice per flush
	// is a no-op:
	const queue = new Set<Job>()
	queues.push(queue)
	return (job: Job) => {
		queue.add(job)
	}
}

// The steps, in flush order:
export const update = step() // write the new data to the DOM
export const measureChars = step() // measure any chars added/removed by update
export const updateChars = step() // write their values; pop the removed ones
export const measureAnimations = step() // measure for the FLIP animations
export const animate = step() // start the animations

// Prevent re-entrant flushes, i.e. an animationsstart listener or a plugin
// (the only user code that runs mid-flush) triggering another one via
// didUpdate() or an update. Their jobs get drained by the outer flush's
// last pass instead of interleaving with its current step:
let flushing = false

export const flush = () => {
	if (flushing) return
	flushing = true
	try {
		// Jobs can queue other jobs into any step (even an already-processed
		// one, mid-flush); keep draining until everything's flushed:
		while (queues.some((queue) => queue.size)) {
			for (const queue of queues) {
				while (queue.size) {
					const jobs = [...queue]
					queue.clear()
					jobs.forEach((job) => job())
				}
			}
		}
	} finally {
		flushing = false
	}
}
