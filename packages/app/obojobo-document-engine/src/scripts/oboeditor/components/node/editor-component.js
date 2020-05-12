import React from 'react'
import Common from 'obojobo-document-engine/src/scripts/common'
import { ReactEditor } from 'slate-react'

import { Transforms, Path, Editor } from 'slate'

import InsertMenu from './components/insert-menu'
import MoreInfoBox from '../navigation/more-info-box'

import './editor-component.scss'

const INSERT_BEFORE = true
const INSERT_AFTER = false
const QUESTION_NODE = 'ObojoboDraft.Chunks.Question'
const ASSESSMENT_NODE = 'ObojoboDraft.Sections.Assessment'

const getSlatePath = props => {
	return ReactEditor.findPath(props.editor, props.element)
}

const pathToSiblingIndex = path => path[path.length - 1]

const { OboModel } = Common.models
class Node extends React.Component {
	constructor(props) {
		super(props)
		this.insertBlockBefore = this.insertBlockAt.bind(this, INSERT_BEFORE)
		this.insertBlockAfter = this.insertBlockAt.bind(this, INSERT_AFTER)
	}

	insertBlockAt(where, item) {
		const newBlock = item.cloneBlankNode()
		const thisPath = getSlatePath(this.props)
		const targetPath = where === INSERT_BEFORE ? thisPath : Path.next(thisPath)
		Transforms.insertNodes(this.props.editor, newBlock, { at: targetPath })
		Transforms.select(this.props.editor, Editor.start(this.props.editor, targetPath))
	}

	saveId(prevId, newId) {
		if (prevId === newId) return

		// check against existing nodes for duplicate keys
		const model = OboModel.models[prevId]

		if (!newId) {
			return 'Please enter an id.'
		}

		if (!model.setId(newId)) {
			return `The id "${newId}" already exists. Please choose a unique id.`
		}

		const thisPath = getSlatePath(this.props)
		Transforms.setNodes(this.props.editor, { id: newId }, { at: thisPath })
	}

	saveContent(prevContent, newContent) {
		const thisPath = getSlatePath(this.props)
		Transforms.setNodes(this.props.editor, { content: newContent }, { at: thisPath })
	}

	deleteNode() {
		// Cursor focus is automatically returned to the editor by the onChange function
		const thisPath = getSlatePath(this.props)
		Transforms.removeNodes(this.props.editor, { at: thisPath })
	}

	duplicateNode() {
		const newNode = { ...this.props.element }
		const thisPath = getSlatePath(this.props)
		const nextPath = Path.next(thisPath)
		Transforms.insertNodes(this.props.editor, newNode, { at: nextPath })
	}

	onOpen() {
		// Lock the editor into readOnly to prevent it from stealing cursor focus
		this.props.editor.toggleEditable(false)
	}

	onClose() {
		// Give cursor focus back to the editor
		this.props.editor.toggleEditable(true)
	}

	moveNode(targetIndex) {
		const thisPath = getSlatePath(this.props)
		const thisSiblingIndex = pathToSiblingIndex(thisPath)
		const targetPath =
			thisSiblingIndex < targetIndex ? Path.next(thisPath) : Path.previous(thisPath)

		const options = {
			at: thisPath,
			to: targetPath
		}

		Transforms.moveNodes(this.props.editor, options)
	}

	renderMoreInfo() {
		const thisPath = getSlatePath(this.props)
		const [parentNode] = Editor.parent(this.props.editor, thisPath)
		let siblingCount = parentNode.children.length
		let thisSiblingIndex = pathToSiblingIndex(thisPath)

		// A node inside a question content cannot move past multiple choices

		if (parentNode.type === QUESTION_NODE) {
			if (siblingCount > 0 && parentNode.children[siblingCount - 1].type === QUESTION_NODE) {
				siblingCount--
			}
			siblingCount--
		}

		// Direct children of Asssessment cannot be moved
		if (parentNode.type === ASSESSMENT_NODE) {
			thisSiblingIndex = 0
			siblingCount = 1
		}

		return (
			<MoreInfoBox
				className="content-node"
				index={thisSiblingIndex}
				type={this.props.element.type}
				id={this.props.element.id}
				content={this.props.element.content || {}}
				saveId={this.saveId.bind(this)}
				saveContent={this.saveContent.bind(this)}
				contentDescription={this.props.contentDescription || []}
				deleteNode={this.deleteNode.bind(this)}
				duplicateNode={this.duplicateNode.bind(this)}
				markUnsaved={this.props.editor.markUnsaved}
				onOpen={this.onOpen.bind(this)}
				onClose={this.onClose.bind(this)}
				moveNode={this.moveNode.bind(this)}
				showMoveButtons
				isFirst={thisSiblingIndex === 0}
				isLast={thisSiblingIndex >= siblingCount - 1}
			/>
		)
	}

	render() {
		const className = `oboeditor-component component ${this.props.className || ''}`

		return (
			<div className={className} data-obo-component="true">
				{this.props.selected && !this.props.hideInsertMenus ? (
					<div className={'component-toolbar'}>
						<InsertMenu
							dropOptions={Common.Registry.insertableItems}
							className={'align-left top'}
							icon="+"
							masterOnClick={this.insertBlockBefore}
						/>
						<InsertMenu
							dropOptions={Common.Registry.insertableItems}
							className={'align-left bottom'}
							icon="+"
							masterOnClick={this.insertBlockAfter}
						/>
					</div>
				) : null}
				{this.props.selected ? this.renderMoreInfo() : null}

				{this.props.children}
			</div>
		)
	}
}

export default Node
