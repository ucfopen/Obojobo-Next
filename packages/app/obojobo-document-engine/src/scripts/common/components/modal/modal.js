import './modal.scss'

import React from 'react'
import DeleteButton from '../delete-button'
import ModalUtil from '../../util/modal-util'

class Modal extends React.Component {
	constructor() {
		super()
		this.selfRef = React.createRef()
		this.boundKeyUp = this.onKeyUp.bind(this)
		this.deleteButtonRef = React.createRef()
		this.onTabTrapFocus = this.onTabTrapFocus.bind(this)
	}

	componentDidMount() {
		document.addEventListener('keyup', this.boundKeyUp)

		if (this.selfRef.current) {
			this.selfRef.current.focus()
		}
	}

	componentWillUnmount() {
		document.removeEventListener('keyup', this.boundKeyUp)
	}

	onKeyUp(event) {
		if (!!this.props.onClose && event.keyCode === 27) {
			// ESC
			this.props.onClose()
			ModalUtil.hide()
		}
	}

	onTabTrapFocus() {
		if (this.props.onClose) {
			return this.deleteButtonRef.current.focus()
		}

		if (this.props.focusOnFirstElement) {
			return this.props.focusOnFirstElement()
		}
	}

	render() {
		return (
			<div
				className={
					'obojobo-draft--components--modal--modal' +
					(this.props.className ? ' ' + this.props.className : '') +
					(this.props.hideCloseButton ? ' hide-close-button' : '')
				}
				role="dialog"
				aria-labelledby="obojobo-draft--components--modal--modal--content"
				tabIndex="-1"
				ref={this.selfRef}
			>
				<input
					aria-label="Start of dialog"
					className="first-tab"
					type="text"
					onFocus={this.onTabTrapFocus}
				/>
				{this.props.onClose ? (
					<DeleteButton ref={this.deleteButtonRef} onClick={this.props.onClose} />
				) : null}
				<div className="content" id="obojobo-draft--components--modal--modal--content">
					{this.props.children}
				</div>
				<input
					aria-label="End of dialog"
					className="last-tab"
					type="text"
					onFocus={this.onTabTrapFocus}
				/>
			</div>
		)
	}
}

export default Modal
