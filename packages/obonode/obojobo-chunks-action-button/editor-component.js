import './viewer-component.scss'
import './editor-component.scss'

import React from 'react'
import { ReactEditor } from 'slate-react'
import { Transforms } from 'slate'
import Common from 'obojobo-document-engine/src/scripts/common'
import Node from 'obojobo-document-engine/src/scripts/oboeditor/components/node/editor-component'
import withSlateWrapper from 'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper'
import TriggerListModal from 'obojobo-document-engine/src/scripts/oboeditor/components/triggers/trigger-list-modal'
import ActionButtonEditorAction from './action-button-editor-action'
import {
	freezeEditor,
	unfreezeEditor
} from 'obojobo-document-engine/src/scripts/oboeditor/util/freeze-unfreeze-editor'
const { ModalUtil } = Common.util
const { Button } = Common.components

/**
 * Display an Obojobo Action button node.  Users can type into the main body of the Action Button
 * to change the label text. When the node is selected, display a menu that contains a list of
 * actions associated with the onClick trigger, as well a button to launch the Trigger Dialog so
 * that users can edit the onClick actions.
 */
class ActionButton extends React.Component {
	constructor(props) {
		super(props)
		this.closeModal = this.closeModal.bind(this)
		this.showTriggersModal = this.showTriggersModal.bind(this)
		this.returnFocusOnTab = this.returnFocusOnTab.bind(this)
	}

	showTriggersModal() {
		freezeEditor(this.props.editor)
		ModalUtil.show(
			<TriggerListModal content={this.props.element.content} onClose={this.closeModal} />
		)
	}

	// Hide the popup modal, and then use Slate's Transforms library to save any changes that the
	// user made to the onClick actions by combining the previous content and the current content.
	// is called w/o arguments when TriggerListModal cancels
	closeModal(modalState) {
		unfreezeEditor(this.props.editor)
		ModalUtil.hide()
		if (!modalState) return

		const path = ReactEditor.findPath(this.props.editor, this.props.element)

		Transforms.setNodes(
			this.props.editor,
			{
				content: {
					...this.props.element.content,
					triggers: Object.values(modalState.triggers)
				}
			},
			{ at: path }
		)
	}

	returnFocusOnTab(event) {
		// Since there is only one button, return on both tab and shift-tab
		if (event.key === 'Tab') {
			event.preventDefault()
			return ReactEditor.focus(this.props.editor)
		}
	}

	renderTriggers() {
		const content = this.props.element.content
		const onClickTrigger = content.triggers.find(trigger => trigger.type === 'onClick') || null
		const isAnOnClickActionSet =
			onClickTrigger && onClickTrigger.actions && onClickTrigger.actions.length > 0

		return (
			<div className="trigger-box" contentEditable={false}>
				<div className="box-border">
					<div className="trigger-list">
						<div className="title">When the button is clicked:</div>
						{isAnOnClickActionSet ? (
							onClickTrigger.actions.map((action, index) => (
								<ActionButtonEditorAction key={index} {...action} />
							))
						) : (
							<div className="trigger no-actions">(No action set)</div>
						)}
					</div>
					<Button
						className="add-action"
						onClick={this.showTriggersModal}
						onKeyDown={this.returnFocusOnTab}
					>
						{isAnOnClickActionSet ? 'Edit Triggers' : 'Set an action...'}
					</Button>
				</div>
			</div>
		)
	}

	render() {
		return (
			<Node {...this.props}>
				<div className="text-chunk obojobo-draft--chunks--action-button pad">
					<div
						className={
							'obojobo-draft--components--button align-' +
							(this.props.element.content.align || 'center')
						}
					>
						<div className="button">{this.props.children}</div>
					</div>
					{this.props.selected ? this.renderTriggers(this.props, this.props.editor) : null}
				</div>
			</Node>
		)
	}
}

export default withSlateWrapper(ActionButton)
