// import '../../viewer-component.scss'

import React from 'react'
import { ReactEditor } from 'slate-react'
import { Editor, Transforms, Range } from 'slate'
import withSlateWrapper from 'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper'
import EdgeControls from '../edge-controls'
import ExcerptEditControls from '../excerpt-edit-controls'
import getPresetProps from '../../get-preset-props'

const getEdgeOptionsForBodyStyle = bodyStyle => {
	switch (bodyStyle) {
		case 'none':
			return []

		case 'filled-box':
		case 'bordered-box':
		case 'card':
		case 'white-paper':
		case 'modern-paper':
		case 'light-yellow-paper':
		case 'dark-yellow-paper':
		case 'aged-paper':
			return ['normal', 'fade', 'jagged']

		default:
			return ['normal', 'fade']
	}
}

const ExcerptContent = props => {
	const onChangeEdge = (edge, edgeType) => {
		const [parent, parentPath] = Editor.parent(
			props.editor,
			ReactEditor.findPath(props.editor, props.element)
		)
		const parentContent = parent.content
		const newContent = { ...parentContent, [edge]: edgeType }

		// We update both this node and the parent node, as they both maintain copies of the same
		// content - necessary to get both to re-render
		Transforms.setNodes(props.editor, { content: { ...newContent } }, { at: parentPath })
		Transforms.setNodes(
			props.editor,
			{ content: { ...newContent } },
			{ at: ReactEditor.findPath(props.editor, props.element) }
		)
	}

	// I was moving these methods over here, and then maybe I can no longer have to duplicate
	// properties and just use properties on this one, Excerpt Content?!
	const onChangePreset = presetValue => {
		const [parent, parentPath] = Editor.parent(
			props.editor,
			ReactEditor.findPath(props.editor, props.element)
		)
		const newContent = {
			...props.element.content,
			...getPresetProps(presetValue),
			preset: presetValue
		}

		const path = ReactEditor.findPath(props.editor, props.element)

		// We copy props on ExcerptContent - this is done to force ExcerptContent to update
		Transforms.setNodes(props.editor, { content: { ...newContent } }, { at: path })
		Transforms.setNodes(props.editor, { content: { ...newContent } }, { at: parentPath })
	}

	const onChangeContentValue = (contentValueName, value) => {
		const [parent, parentPath] = Editor.parent(
			props.editor,
			ReactEditor.findPath(props.editor, props.element)
		)
		const path = ReactEditor.findPath(props.editor, props.element)

		const newContent = { ...props.element.content, [contentValueName]: value }

		Transforms.setNodes(props.editor, { content: { ...newContent } }, { at: path })
		Transforms.setNodes(props.editor, { content: { ...newContent } }, { at: parentPath })
	}

	const edgeOptions = getEdgeOptionsForBodyStyle(props.element.content.bodyStyle)

	const shouldShowEdgeControls = props.selected && Range.isCollapsed(props.editor.selection)

	return (
		<div className="excerpt-content">
			{shouldShowEdgeControls ? (
				<React.Fragment>
					<EdgeControls
						position="top"
						edges={edgeOptions}
						selectedEdge={props.element.content.topEdge}
						onChangeEdge={edgeType => onChangeContentValue('topEdge', edgeType)}
					/>
					<EdgeControls
						position="bottom"
						edges={edgeOptions}
						selectedEdge={props.element.content.bottomEdge}
						onChangeEdge={edgeType => onChangeContentValue('bottomEdge', edgeType)}
					/>
					<ExcerptEditControls
						content={props.element.content}
						onChangeProp={(propName, propValue) => onChangeContentValue(propName, propValue)}
						onChangePreset={onChangePreset}
					/>
				</React.Fragment>
			) : null}

			<div className="wrapper">{props.children}</div>
			<div className="overlay" />
		</div>
	)
}

export default withSlateWrapper(ExcerptContent)
