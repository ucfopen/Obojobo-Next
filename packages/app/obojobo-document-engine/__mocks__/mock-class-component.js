import React from 'react'

// from MDN solution https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#Examples
const getCircularReplacer = () => {
	const seen = new WeakSet()
	return (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return
			}
			seen.add(value)
		}
		return value
	}
}

export default class MockClassComponent extends React.Component {
	render() {
		return (
			<div>MockClassComponent Props: {JSON.stringify(this.props, getCircularReplacer(), 2)}</div>
		)
	}
}
