import React, { memo } from 'react'
import { Block } from 'slate'

import FileMenu from './file-menu'
import ViewMenu from './view-menu'
import DropDownMenu from './drop-down-menu'

import BasicMarks from '../marks/basic-marks'
import LinkMark from '../marks/link-mark'
import ScriptMarks from '../marks/script-marks'
import AlignMarks from '../marks/align-marks'
import IndentMarks from '../marks/indent-marks'

import './file-toolbar.scss'

const textMarks = [...BasicMarks.marks, ...LinkMark.marks, ...ScriptMarks.marks]

const textMenu = {
	name: 'Text',
	type: 'sub-menu',
	menu: textMarks.map(mark => ({
		name: mark.name,
		type: 'action',
		markAction: mark.action
		// action to be assigned in render
	}))
}

const paragraphMenu = {
	name: 'Paragraph styles',
	type: 'sub-menu',
	menu: [
		{ name: 'Normal Text', type: 'action', disabled: true },
		{ name: 'Heading 1', type: 'action', disabled: true },
		{ name: 'Heading 2', type: 'action', disabled: true },
		{ name: 'Heading 3', type: 'action', disabled: true },
		{ name: 'Heading 4', type: 'action', disabled: true },
		{ name: 'Heading 5', type: 'action', disabled: true },
		{ name: 'Heading 6', type: 'action', disabled: true }
	]
}

const alignIndentMarks = [...AlignMarks.marks, ...IndentMarks.marks]

const alignMenu = {
	name: 'Align & indent',
	type: 'sub-menu',
	menu: alignIndentMarks.map(mark => ({
		name: mark.name,
		type: 'action',
		markAction: mark.action
		// action to be assigned in render
	}))
}

const bulletsMenu = {
	name: 'Bullets & numbering',
	type: 'sub-menu',
	menu: [
		{
			name: 'Bulleted List',
			type: 'sub-menu',
			menu: [
				{ name: 'Disc', type: 'action', disabled: true },
				{ name: 'Circle', type: 'action', disabled: true },
				{ name: 'Square', type: 'action', disabled: true }
			]
		},
		{
			name: 'Numbered List',
			type: 'sub-menu',
			menu: [
				{ name: 'Numbers', type: 'action', disabled: true },
				{ name: 'Uppercase Alphabet', type: 'action', disabled: true },
				{ name: 'Uppercase Roman Numerals', type: 'action', disabled: true },
				{ name: 'Lowercase Alphabet', type: 'action', disabled: true },
				{ name: 'Lowercase Roman Numerals', type: 'action', disabled: true }
			]
		}
	]
}

const formatMenu = [textMenu, paragraphMenu, alignMenu, bulletsMenu]

const isCollapsed = selection => {
	return selection.focus.key === selection.anchor.key && selection.focus.offset === selection.anchor.offset
}

const insertDisabled = (name, value) => {
	// If the selected area spans across multiple blocks, the selection is deleted before
	// inserting, colapsing it down to the type of the first block
	const firstType = value.blocks.get(0).type
	if(firstType === 'ObojoboDraft.Chunks.Table.Cell') return true

	if(value.fragment.filterDescendants(node => node.type === 'ObojoboDraft.Chunks.Question')) {
		if(name === 'Question' || name === 'Question Bank') return true

		return false
	}

	return false
}

const FileToolbar = props => {
	// insert actions on menu items
	// note that `editor.current` needs to be evaluated at execution time of the action!
	const editor = props.editorRef
	const insertMenu = props.insertableItems.map(item => ({
		name: item.name,
		action: () => editor.current.insertBlock(Block.create(item.cloneBlankNode())),
		disabled: insertDisabled(item.name, props.value)
	}))

	const editMenu = [
		{ name: 'Undo', type: 'action', action: () => editor.current.undo() },
		{ name: 'Redo', type: 'action', action: () => editor.current.redo() },
		{ name: 'Delete', type: 'action', action: () => editor.current.delete(), disabled: isCollapsed(props.value.selection) },
		{ name: 'Select all', type: 'action', action: () => editor.current.moveToRangeOfDocument().focus() }
	]
	textMenu.menu.forEach(i => {
		i.action = () => i.markAction(editor.current)
	})
	alignMenu.menu.forEach(i => {
		i.action = () => i.markAction(editor.current)
	})

	const saved = props.saved ? 'saved' : ''
	return (
		<div className={`visual-editor--file-toolbar`}>
			<FileMenu
				model={props.model}
				draftId={props.draftId}
				onSave={props.onSave}
				onRename={props.onRename}
				mode={props.mode}
			/>
			<div className="visual-editor--drop-down-menu">
				<DropDownMenu name="Edit" menu={editMenu} />
			</div>
			<ViewMenu
				draftId={props.draftId}
				switchMode={props.switchMode}
				onSave={props.onSave}
				mode={props.mode}
				togglePlaceholders={props.togglePlaceholders}
				showPlaceholders={props.showPlaceholders}
			/>
			<div className="visual-editor--drop-down-menu">
				<DropDownMenu name="Insert" menu={insertMenu} />
			</div>
			{props.mode === 'visual' ? (
				<div className="visual-editor--drop-down-menu">
					<DropDownMenu name="Format" menu={formatMenu} disabled={isCollapsed(props.value.selection)}/>
				</div>
			) : null}
			<div className={'saved-message ' + saved}>Saved!</div>
		</div>
	)
}

export default memo(FileToolbar)
