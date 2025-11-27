import React from 'react'

export type SnapshotterProps = {
	dependencies?: React.DependencyList
	onSnapshot: () => void
}

export class Snapshotter extends React.Component<SnapshotterProps> {
	override getSnapshotBeforeUpdate(prevProps: SnapshotterProps) {
		// If the dependencies have changed, run the snapshot function
		if (
			!this.props.dependencies ||
			!prevProps.dependencies ||
			this.props.dependencies.length !== prevProps.dependencies.length ||
			this.props.dependencies.some((dep, d) => !Object.is(dep, prevProps.dependencies![d]))
		) {
			this.props.onSnapshot()
		}
		// Need to return null to satisfy React
		return null
	}
	override componentDidUpdate() {
		// we don't use this but React will complain if we don't implement it
	}
	override render() {
		return null
	}
}
