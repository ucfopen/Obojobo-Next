import './viewer-component.scss'
import './editor-component.scss'

import React from 'react'
import Node from 'obojobo-document-engine/src/scripts/oboeditor/components/node/editor-component'
import withSlateWrapper from 'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper'
import { Transforms, Range, Editor } from 'slate'
import { ReactEditor } from 'slate-react'

import getPresetProps from './get-preset-props'
import ExcerptEditControls from './components/excerpt-edit-controls'

class Excerpt extends React.Component {
	// constructor(props) {
	// 	super(props)

	// 	// this.onChangePreset = this.onChangePreset.bind(this)
	// 	// this.onClickMoreOptions = this.onClickMoreOptions.bind(this)

	// 	// this.state = {
	// 	// 	isShowingMoreOptions: false
	// 	// }
	// }

	// onClickMoreOptions() {
	// 	this.setState({
	// 		isShowingMoreOptions: !this.state.isShowingMoreOptions
	// 	})
	// }

	// onChangePreset(presetValue) {
	// 	const newContent = {
	// 		...this.props.element.content,
	// 		...getPresetProps(presetValue),
	// 		preset: presetValue
	// 	}

	// 	const path = ReactEditor.findPath(this.props.editor, this.props.element)
	// 	Transforms.setNodes(
	// 		this.props.editor,
	// 		{
	// 			content: { ...newContent }
	// 		},
	// 		{ at: path }
	// 	)

	// 	// We copy props on ExcerptContent - this is done to force ExcerptContent to update
	// 	Transforms.setNodes(this.props.editor, { content: { ...newContent } }, { at: path.concat(0) })
	// }

	// onChangeContentValue(contentValueName, value) {
	// 	const path = ReactEditor.findPath(this.props.editor, this.props.element)

	// 	const newContent = { ...this.props.element.content, [contentValueName]: value }
	// 	Transforms.setNodes(this.props.editor, { content: { ...newContent } }, { at: path })

	// 	// We copy props on ExcerptContent - this is done to force ExcerptContent to update
	// 	Transforms.setNodes(this.props.editor, { content: { ...newContent } }, { at: path.concat(0) })
	// }

	render() {
		const content = this.props.element.content

		const shouldShowEdgeControls =
			this.props.selected && Range.isCollapsed(this.props.editor.selection)

		// console.log('@TODO: Make sure these css class names wont bleed')
		// console.log('@TODO: when excerpt is the last item the menu obscures the (+) button')
		// console.log('@TODO: you can delete citations')
		// console.log('@TODO: over time multiple cite lines are created')
		// console.log('@TODO: glow text leaks into the caption')
		// console.log('@TODO: hitting enter too quickly results in a crash')
		// console.log('@TODO: preview is disabled')
		/*${
						this.state.isShowingMoreOptions
							? 'is-showing-more-options'
							: 'is-not-showing-more-options'
					} */
		return (
			<Node {...this.props}>
				<div
					className={`text-chunk obojobo-draft--chunks--excerpt pad ${
						this.props.selected ? 'is-selected' : 'is-not-selected'
					} is-body-style-type-${content.bodyStyle} is-top-edge-type-${
						content.topEdge
					} is-bottom-edge-type-${content.bottomEdge} is-width-${content.width} is-font-${
						content.font
					} is-font-style-${content.fontStyle} is-line-height-type-${
						content.lineHeight
					} is-font-size-${content.fontSize} ${
						content.effect ? 'is-showing-effect' : 'is-not-showing-effect'
					}`}
				>
					<button
						onClick={() => {
							const path = ReactEditor.findPath(this.props.editor, this.props.element)
							// Editor.withoutNormalizing(this.props.editor, () => {
							Transforms.removeNodes(this.props.editor, { at: path.concat(0) })
							// })
						}}
					>
						Delete EXCERPT_CONTENT
					</button>
					<button
						onClick={() => {
							const path = ReactEditor.findPath(this.props.editor, this.props.element)
							// Editor.withoutNormalizing(this.props.editor, () => {
							Transforms.removeNodes(this.props.editor, { at: path.concat(1) })
							// })
						}}
					>
						Delete CITE_TEXT
					</button>
					<blockquote>
						{this.props.children}
						{/* {shouldShowEdgeControls ? (
							<ExcerptEditControls
								content={content}
								isShowingMoreOptions={this.state.isShowingMoreOptions}
								onChangeProp={(propName, propValue) =>
									this.onChangeContentValue(propName, propValue)
								}
								onChangePreset={this.onChangePreset}
								onClickMoreOptions={this.onClickMoreOptions}
							/>
						) : null} */}
					</blockquote>
				</div>
			</Node>
		)
	}
}

export default withSlateWrapper(Excerpt)
