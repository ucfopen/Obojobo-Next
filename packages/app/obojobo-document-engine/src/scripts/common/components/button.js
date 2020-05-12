import './button.scss'

import Common from '../index'
import React from 'react'

export default class Button extends React.Component {
	constructor(props) {
		super(props)
		this.buttonRef = React.createRef()
	}

	static get defaultProps() {
		return {
			value: null,
			disabled: false,
			align: 'center'
		}
	}

	focus() {
		Common.page.focus(this.buttonRef)
	}

	render() {
		let children
		// if value is empty string
		// value will still be rendered
		// eslint-disable-next-line eqeqeq
		if (this.props.value != null) {
			children = this.props.value
		} else {
			// eslint-disable-next-line no-extra-semi
			;({ children } = this.props)
		}

		const className =
			'obojobo-draft--components--button' +
			(this.props.altAction ? ' alt-action' : '') +
			Common.util.isOrNot(this.props.isDangerous, 'dangerous') +
			` align-${this.props.align}` +
			(this.props.className ? ` ${this.props.className}` : '')

		return (
			<div className={className}>
				<button
					ref={this.buttonRef}
					className={'button'}
					onClick={this.props.onClick}
					tabIndex={this.props.shouldPreventTab ? '-1' : this.props.tabIndex}
					disabled={this.props.disabled || this.props.shouldPreventTab}
					aria-label={this.props.ariaLabel}
					aria-selected={this.props.ariaSelected}
					contentEditable={false}
					onKeyDown={this.props.onKeyDown}
					onFocus={this.props.onFocus}
					onBlur={this.props.onBlur}
				>
					{children}
				</button>
			</div>
		)
	}
}
