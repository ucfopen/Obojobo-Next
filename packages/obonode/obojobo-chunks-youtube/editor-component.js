import './viewer-component.scss'
import './editor-component.scss'

import React from 'react'
import { ReactEditor } from 'slate-react'
import { Transforms, Editor } from 'slate'

import YouTubeProperties from './youtube-properties-modal'
import YouTubePlayer from './youtube-player'
import Common from 'obojobo-document-engine/src/scripts/common'
import Node from 'obojobo-document-engine/src/scripts/oboeditor/components/node/editor-component'
import withSlateWrapper from 'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper'

const { ModalUtil } = Common.util
const { Button } = Common.components
const isOrNot = Common.util.isOrNot

class YouTube extends React.Component {
	constructor(props) {
		super(props)
		this.handleSourceChange = this.handleSourceChange.bind(this)
		this.focusYoutube = this.focusYoutube.bind(this)
		this.deleteNode = this.deleteNode.bind(this)
		this.showSourceModal = this.showSourceModal.bind(this)
		this.returnFocusOnTab = this.returnFocusOnTab.bind(this)
	}
	showSourceModal(event) {
		event.stopPropagation()

		ModalUtil.show(
			<YouTubeProperties content={this.props.element.content} onConfirm={this.handleSourceChange} />
		)
	}

	handleSourceChange(content) {
		ModalUtil.hide()
		const path = ReactEditor.findPath(this.props.editor, this.props.element)

		Transforms.setNodes(
			this.props.editor,
			{ content: { ...this.props.element.content, ...content } },
			{ at: path }
		)
	}

	renderNoVideo() {
		return (
			<div className="empty-frame">
				<div>
					<p>No video specified. Click &apos;Edit&apos; to add one.</p>
				</div>
			</div>
		)
	}

	renderVideo() {
		return <YouTubePlayer content={this.props.element.content} />
	}

	deleteNode() {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		Transforms.removeNodes(this.props.editor, { at: path })
	}

	focusYoutube() {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		const start = Editor.start(this.props.editor, path)
		Transforms.setSelection(this.props.editor, {
			focus: start,
			anchor: start
		})
	}

	returnFocusOnTab(event) {
		if (event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault()
			return ReactEditor.focus(this.props.editor)
		}
	}

	render() {
		const content = this.props.element.content

		const isSelected = isOrNot(this.props.selected, 'selected')

		return (
			<Node {...this.props}>
				<div
					contentEditable={false}
					className={`obojobo-draft--chunks--you-tube viewer pad ${isSelected}`}
					onClick={this.focusYoutube.bind(this)}
				>
					<Button className="delete-button" onClick={this.deleteNode.bind(this)}>
						×
					</Button>
					{content.videoId ? this.renderVideo() : this.renderNoVideo()}
					<Button
						className="edit-button"
						onClick={this.showSourceModal}
						onKeyDown={this.returnFocusOnTab}
						tabIndex={this.props.selected ? 0 : -1}
					>
						Edit
					</Button>

					{this.props.children}
				</div>
			</Node>
		)
	}
}

export default withSlateWrapper(YouTube)
