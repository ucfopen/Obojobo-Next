import React from 'react'
import { Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import Common from 'obojobo-document-engine/src/scripts/common'
import SelectionUtil from 'obojobo-document-engine/src/scripts/oboeditor/util/selection-util'
import withSlateWrapper from 'obojobo-document-engine/src/scripts/oboeditor/components/node/with-slate-wrapper'

import './editor-component.scss'

const isOrNot = Common.util.isOrNot
const { Button, Switch } = Common.components
const MCCHOICE_NODE = 'ObojoboDraft.Chunks.MCAssessment.MCChoice'
const MCANSWER_NODE = 'ObojoboDraft.Chunks.MCAssessment.MCAnswer'
const TEXT_NODE = 'ObojoboDraft.Chunks.Text'
const TEXT_LINE_NODE = 'ObojoboDraft.Chunks.Text.TextLine'

class MCAssessment extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			open: true
		}

		this.toggleOpen = this.toggleOpen.bind(this)
	}

	componentDidUpdate(prevProps) {
		// When the cursor moves into the mcassessment, expand it
		if(!prevProps.selected && this.props.selected) {
			this.setState({ open: true })
		}
	}

	changeResponseType(event) {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		return Transforms.setNodes(
			this.props.editor, 
			{ content: { ...this.props.element.content, responseType: event.target.value } },
			{ at: path }
		)
	}

	changeShuffle(shuffle) {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		return Transforms.setNodes(
			this.props.editor, 
			{ content: { ...this.props.element.content, shuffle } },
			{ at: path }
		)
	}

	addChoice() {
		const path = ReactEditor.findPath(this.props.editor, this.props.element)
		return Transforms.insertNodes(
			this.props.editor,
			{
				type: MCCHOICE_NODE,
				content: { score: 0 },
				children: [
					{
						type: MCANSWER_NODE,
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

	toggleOpen() {
		this.setState(prevState => {
			if(prevState.open) {
				// Move the selection outside of the mcassess if it is currently in there
				const path = ReactEditor.findPath(this.props.editor, this.props.element)
				SelectionUtil.moveSelectionOutsideNode(this.props.editor, path)
				
				// Close the mcassess
				return ({ open: false })
			}

			return ({ open: true })
		})
	}

	displaySummary() {
		const { element } = this.props

		if(element.questionType === 'survey') {
			const answers = element.children.length
			const answerText = answers > 1 ? answers + ' choices' : answers + ' choice'
			return (
				<div contentEditable={false}>
				{ answerText + ' hidden' }
				</div>
			)
		}

		const correctChoices = element.children.filter(node => node.content.score === 100).length
		const incorrectChoices = element.children.filter(node => node.content.score !== 100).length

		// Parse the number of children into readable text
		let correctText = correctChoices > 0 ? correctChoices + ' correct choice' : ''
		correctText = correctChoices > 1 ? correctText + 's' : correctText
		correctText = correctText && incorrectChoices > 0 ? correctText + ' and ' : correctText

		let incorrectText = incorrectChoices > 0 ? incorrectChoices + ' incorrect choice' : ''
		incorrectText = incorrectChoices > 1 ? incorrectText + 's' : incorrectText

		// There will always be at least one question/questionbank inside a question bank
		// so we will always need to display this text.
		return (
			<div contentEditable={false}>
				{ correctText + incorrectText + ' hidden' }
			</div>
		)
	}

	render() {
		const questionType = this.props.element.questionType || 'default'
		const content = this.props.element.content

		const className = `component obojobo-draft--chunks--mc-assessment editor--mc-assessment is-type-${questionType}` 
			+ isOrNot(this.state.open, 'open')

		return (
			<div className={className}>
				<Button
					className="collapse-button"
					onClick={this.toggleOpen}
					contentEditable={false}>
					{'⌃'}
				</Button>
				{!this.state.open ? this.displaySummary() : null}
				<div className="mc-content">
					<div className="mc-settings" contentEditable={false}>
						<label>
							Response Type
							<select value={content.responseType} onChange={this.changeResponseType.bind(this)}>
								<option value="pick-one">Pick one correct answer</option>
								<option value="pick-all">Pick all correct answers</option>
							</select>
						</label>
						<Switch
							title="Shuffle Choices"
							initialChecked={content.shuffle}
							handleCheckChange={this.changeShuffle.bind(this)}
						/>
					</div>
					<div>
						{this.props.children}
						<Button className={'choice-button pad'} onClick={this.addChoice.bind(this)}>
							{'+ Add Choice'}
						</Button>
					</div>
				</div>
			</div>
		)
	}
}

export default withSlateWrapper(MCAssessment)
