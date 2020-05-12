import './viewer-component.scss'
import './editor-component.scss'

import { Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import Common from 'obojobo-document-engine/src/scripts/common'
import withSlateWrapper from 'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper'
import React from 'react'
import Node from 'obojobo-document-engine/src/scripts/oboeditor/components/node/editor-component'

const { Button } = Common.components
const QUESTION_NODE = 'ObojoboDraft.Chunks.Question'
const SOLUTION_NODE = 'ObojoboDraft.Chunks.Question.Solution'
const MCASSESSMENT_NODE = 'ObojoboDraft.Chunks.MCAssessment'
const PAGE_NODE = 'ObojoboDraft.Pages.Page'
const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Text.TextLine'

class Question extends React.Component {
	constructor(props) {
		super(props)
		this.addSolution = this.addSolution.bind(this)
		this.delete = this.delete.bind(this)
		this.onSetType = this.onSetType.bind(this)
	}

	onSetType(event) {
		const type = event.target.checked ? 'survey' : 'default'

		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		Transforms.setNodes(
			this.props.editor,
			{ content: { ...this.props.element.content, type } },
			{ at: path }
		)

		const lastChildIndex = this.props.element.children.length - 1
		return Transforms.setNodes(
			this.props.editor,
			{ questionType: type },
			{ at: path.concat(lastChildIndex) }
		)
	}

	delete() {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		return Transforms.removeNodes(this.props.editor, { at: path })
	}

	addSolution() {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		return Transforms.insertNodes(
			this.props.editor,
			{
				type: QUESTION_NODE,
				subtype: SOLUTION_NODE,
				content: { score: 0 },
				children: [
					{
						type: PAGE_NODE,
						content: {},
						children: [
							{
								type: TEXT_NODE,
								content: {},
								children: [
									{
										type: TEXT_NODE,
										subtype: TEXT_LINE_NODE,
										content: { indent: 0 },
										children: [{ text: '' }]
									}
								]
							}
						]
					}
				]
			},
			{ at: path.concat(this.props.element.children.length) }
		)
	}

	render() {
		const element = this.props.element
		const content = element.content
		const hasSolution = element.children[element.children.length - 1].subtype === SOLUTION_NODE
		let questionType

		// The question type is determined by the MCAssessment or the NumericAssessement
		// This is either the last node or the second to last node
		if (hasSolution) {
			questionType = element.children[element.children.length - 2].type
		} else {
			questionType = element.children[element.children.length - 1]
		}

		return (
			<Node 
				{...this.props} 
				className="obojobo-draft--chunks--question--wrapper"
				hideInsertMenus={ ReactEditor.findPath(this.props.editor, this.props.element).length > 1 }>
				<div
					className={`component obojobo-draft--chunks--question is-viewed pad is-type-${content.type}`}>
					<div className="flipper question-editor">
						<div className="content-back">
							<div className="question-settings" contentEditable={false}>
								<label>Question Type</label>
								<select contentEditable={false} defaultValue={questionType}>
									<option value={MCASSESSMENT_NODE}>Multiple Choice</option>
								</select>
								<label className="question-type" contentEditable={false}>
									<input
										type="checkbox"
										name="vehicle1"
										value="Bike"
										checked={content.type === 'survey'}
										onChange={this.onSetType}
									/>
									Survey Only
								</label>
							</div>
							{this.props.children}
							{hasSolution ? null : (
								<Button className="add-solution" onClick={this.addSolution} contentEditable={false}>
									Add Solution
								</Button>
							)}
						</div>
					</div>
					<Button className="delete-button" onClick={() => this.delete()} contentEditable={false}>
						×
					</Button>
				</div>
			</Node>
		)
	}
}

export default withSlateWrapper(Question)
