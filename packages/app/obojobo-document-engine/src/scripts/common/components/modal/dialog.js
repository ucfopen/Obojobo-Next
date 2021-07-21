import './dialog.scss'

import Button from '../button'
import Modal from './modal'
import React from 'react'

export default class Dialog extends React.Component {
	constructor(props) {
		super(props)
		this.buttonRefs = []
		this.focusOnFirstElement = this.focusOnFirstElement.bind(this)
	}

	static get defaultProps() {
		return { centered: true, buttons: [] }
	}

	componentDidMount() {
		const buttons = this.props.buttons || []

		return (() => {
			const result = []
			for (let index = 0; index < buttons.length; index++) {
				const button = buttons[index]
				let item
				if (button.default) {
					item = this.buttonRefs[index].focus()
				}
				result.push(item)
			}
			return result
		})()
	}

	focusOnFirstElement() {
		if (this.props.focusOnFirstElement) {
			return this.props.focusOnFirstElement()
		}

		return this.buttonRefs[0].focus()
	}

	render() {
		// clear ref array
		this.buttonRefs.slice(0)

		const buttons = this.props.buttons || []

		let styles = null
		if (this.props.width) {
			styles = { width: this.props.width }
		}

		const className = 'obojobo-draft--components--modal--dialog ' + (this.props.className || '')

		return (
			<div className={className} style={styles}>
				<Modal
					onClose={this.props.onClose}
					focusOnFirstElement={this.focusOnFirstElement}
					className={this.props.modalClassName}
					hideCloseButton={this.props.hideCloseButton}
				>
					{this.props.title ? (
						<h1 className="heading" style={{ textAlign: this.props.centered ? 'center' : null }}>
							{this.props.title}
						</h1>
					) : null}
					<div
						className="dialog-content"
						style={{ textAlign: this.props.centered ? 'center' : null }}
					>
						{this.props.children}
					</div>
					<div className="controls">
						{buttons.map((buttonPropsOrText, index) => {
							if (typeof buttonPropsOrText === 'string') {
								return (
									<span key={index} className="text">
										{buttonPropsOrText}
									</span>
								)
							}
							buttonPropsOrText.key = index
							return (
								<Button
									key={index}
									ref={el => {
										this.buttonRefs[index] = el
									}}
									{...buttonPropsOrText}
								/>
							)
						})}
						{this.props.customControls}
					</div>
				</Modal>
			</div>
		)
	}
}
