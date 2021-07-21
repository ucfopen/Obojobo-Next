import './simple-dialog.scss'

import React from 'react'

import ModalUtil from '../../util/modal-util'
import Dialog from './dialog'

class SimpleDialog extends React.Component {
	constructor(props) {
		super(props)

		this.focusOnFirstElement = this.focusOnFirstElement.bind(this)
	}

	focusOnFirstElement() {
		if (this.props.focusOnFirstElement) {
			this.props.focusOnFirstElement()
		}
	}

	render() {
		let buttons
		if (this.props.ok) {
			buttons = [
				{
					value: 'OK',
					onClick: this.props.onConfirm,
					default: true
				}
			]
		} else if (this.props.noOrYes) {
			buttons = [
				{
					value: 'No',
					onClick: this.props.onCancel
				},
				'or',
				{
					value: 'Yes',
					onClick: this.props.onConfirm,
					default: true
				}
			]
		} else if (this.props.yesOrNo) {
			buttons = [
				{
					value: 'Yes',
					onClick: this.props.onConfirm
				},
				'or',
				{
					value: 'No',
					onClick: this.props.onCancel,
					default: true
				}
			]
		} else {
			buttons = [
				{
					value: 'Cancel',
					altAction: true,
					onClick: this.props.onCancel
				},
				{
					value: 'OK',
					onClick: this.props.onConfirm,
					default: true
				}
			]
		}

		return (
			<div className="obojobo-draft--components--modal--simple-dialog">
				<Dialog
					centered
					buttons={buttons}
					title={this.props.title}
					width={this.props.width}
					focusOnFirstElement={this.focusOnFirstElement}
					preventEsc={!this.props.onCancel}
					onClose={this.props.onCancel}
					modalClassName={this.props.modalClassName}
					hideCloseButton={this.props.hideCloseButton}
				>
					{this.props.children}
				</Dialog>
			</div>
		)
	}
}

SimpleDialog.defaultProps = {
	ok: false,
	noOrYes: false,
	yesOrNo: false,
	cancelOk: false,
	title: null,
	width: null,
	preventEsc: false,
	modalClassName: '',
	onCancel() {
		return ModalUtil.hide()
	},
	onConfirm() {
		return ModalUtil.hide()
	}
}

export default SimpleDialog
