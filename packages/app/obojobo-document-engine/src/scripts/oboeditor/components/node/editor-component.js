import React from 'react'
import Common from 'obojobo-document-engine/src/scripts/common'
import { ReactEditor } from 'slate-react'

import { Transforms, Path, Editor, Element } from 'slate'

import InsertMenu from './components/insert-menu'
import MoreInfoBox from '../navigation/more-info-box'
import isValidId from '../../util/is-valid-id'

import './editor-component.scss'
import isOrNot from '../../../common/util/isornot'

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
		this.saveId = this.saveId.bind(this)
		this.saveContent = this.saveContent.bind(this)
		this.deleteNode = this.deleteNode.bind(this)
		this.duplicateNode = this.duplicateNode.bind(this)
		this.onOpen = this.onOpen.bind(this)
		this.moveNode = this.moveNode.bind(this)
		this.onBlur = this.onBlur.bind(this)
	}

	insertBlockAt(where, item) {
		const newBlock = item.cloneBlankNode()
		const thisPath = getSlatePath(this.props)
		const targetPath = where === INSERT_BEFORE ? thisPath : Path.next(thisPath)

		// Change the node so that the bottom insert menu is closed
		// Also, toggle editable back on so that users can continue editing once
		// the new node is inserted
		Transforms.setNodes(this.props.editor, { open: null }, { at: thisPath })
		this.props.editor.toggleEditable(true)

		Transforms.insertNodes(this.props.editor, newBlock, { at: targetPath })
		Transforms.select(this.props.editor, Editor.start(this.props.editor, targetPath))

		ReactEditor.focus(this.props.editor)
	}

	saveId(prevId, newId) {
		if (prevId === newId) return

		// check against existing nodes for duplicate keys
		const model = OboModel.models[prevId]

		if (!newId) {
			return 'Please enter an id.'
		}

		if (!isValidId(newId)) {
			return 'Invalid characters in id. Only letters, numbers, and special characters (-, _, :, .) are permitted.'
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

	// This method allows the keyboard shortcuts to open and close
	// menus (insert and more info) to play nice with mouse users
	onBlur(menu) {
		// clear the open attribute on the top and bottom nodes
		const nodes = Array.from(
			Editor.nodes(this.props.editor, {
				at: this.props.editor.selection || this.props.editor.prevSelection,
				match: n => Element.isElement(n) && !n.subtype,
				mode: 'lowest'
			})
		)

		// Handle cases where no nodes are selected because the page is changing
		if (nodes.length === 0) {
			return this.props.editor.toggleEditable(true)
		}

		// If the first or last node's open attribute matches the menu we are
		// blurring, we need to clear the open attribute
		if (menu === nodes[0][0].open) {
			// Clear anything open on the first node
			// This could be an insert menu or a more info box
			Transforms.setNodes(
				this.props.editor,
				{ open: null },
				{
					at: nodes[0][1]
				}
			)
		}

		if (menu === nodes[nodes.length - 1][0].open) {
			// Clear anything open on the last node
			// This will only be an insert menu
			Transforms.setNodes(
				this.props.editor,
				{ open: null },
				{
					at: nodes[nodes.length - 1][1]
				}
			)
		}

		// If the only open menu was closed by blurring, return the focus & selection to the editor
		if (
			(!nodes[0][0].open || menu === nodes[0][0].open) &&
			(!nodes[nodes.length - 1][0].open || menu === nodes[nodes.length - 1][0].open)
		) {
			// Give cursor focus back to the editor, reselecting the previous
			// selection if it got nulled
			this.props.editor.toggleEditable(true)

			// Timeout lag allows editable state to percolate
			setTimeout(() => {
				if (!this.props.editor.selection) {
					Transforms.select(this.props.editor, this.props.editor.prevSelection)
				}
				ReactEditor.focus(this.props.editor)
			}, 1)
		}
	}

	moveNode(targetIndex) {
		const thisPath = getSlatePath(this.props)
		const thisSiblingIndex = pathToSiblingIndex(thisPath)
		const targetPath =
			thisSiblingIndex < targetIndex ? Path.next(thisPath) : Path.previous(thisPath)

		// All kinds of issues pop up if the selection spans multiple chunks
		// when using moveNode.  So set the selection to the start of the currently moving element
		Transforms.select(this.props.editor, Editor.start(this.props.editor, thisPath))

		// As for slate 0.57.2 does not support undo/redo for Transforms.moveNodes,
		// this bypass solution will delete the current node and insert it to the appropriate location
		const curNode = { ...this.props.element }
		this.deleteNode()
		Transforms.insertNodes(this.props.editor, curNode, { at: targetPath })
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
				saveId={this.saveId}
				saveContent={this.saveContent}
				contentDescription={this.props.contentDescription || []}
				deleteNode={this.deleteNode}
				duplicateNode={this.duplicateNode}
				markUnsaved={this.props.editor.markUnsaved}
				onOpen={this.onOpen}
				onBlur={this.onBlur}
				tabIndex="-1"
				moveNode={this.moveNode}
				open={this.props.element.open === 'info'}
				showMoveButtons
				isFirst={thisSiblingIndex === 0}
				isLast={thisSiblingIndex >= siblingCount - 1}
			/>
		)
	}

	render() {
		const selected = this.props.selected

		const className = `oboeditor-component component ${isOrNot(selected, 'selected')} ${this.props
			.className || ''}`

		return (
			<div className={className} data-obo-component="true" data-type={this.props.element.type}>
				{this.props.selected ? (
					<div className={'component-toolbar'}>
						<InsertMenu
							dropOptions={Common.Registry.insertableItems}
							className={'align-left top'}
							icon="+"
							open={this.props.element.open === 'top'}
							masterOnClick={this.insertBlockBefore}
							onBlur={this.onBlur.bind(this)}
							menu="top"
						/>
						<InsertMenu
							dropOptions={Common.Registry.insertableItems}
							className={'align-left bottom'}
							icon="+"
							open={this.props.element.open === 'bottom'}
							masterOnClick={this.insertBlockAfter}
							onBlur={this.onBlur.bind(this)}
							menu="bottom"
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
