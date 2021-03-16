import Common from 'obojobo-document-engine/src/scripts/common'
import EditorUtil from '../../util/editor-util'
import isValidId from 'obojobo-document-engine/src/scripts/oboeditor/util/is-valid-id'
import React from 'react'
import MoreInfoBox from './more-info-box'

const { OboModel } = Common.models

class Header extends React.Component {
	constructor(props) {
		super(props)

		this.saveId = this.saveId.bind(this)
		this.saveContent = this.saveContent.bind(this)
	}

	renamePage(pageId, oldTitle, newTitle) {
		// eslint-disable-next-line no-undefined
		if (newTitle !== undefined && newTitle !== null) {
			newTitle = String(newTitle).trim()
		} else {
			newTitle = ''
		}

		if (newTitle !== oldTitle && newTitle !== '') {
			EditorUtil.renamePage(pageId, newTitle)
		}

		return newTitle
	}

	renderLabel(label) {
		return <span>{label || '\u00A0'}</span>
	}

	saveId(oldId, newId) {
		if (oldId === newId) return

		const model = OboModel.models[oldId]

		if (!newId) {
			return 'Please enter an id.'
		}

		if (!isValidId(newId)) {
			return 'Invalid characters in id. Only letters, numbers, and special characters (-, _, :, .) are permitted.'
		}

		// prettier-ignore
		if (!model.setId(newId)) {
			return 'The id "' + newId + '" already exists. Please choose a unique id.'
		}

		EditorUtil.rebuildMenu(OboModel.getRoot())
	}

	saveContent(oldContent, newContent) {
		const item = this.props.list[this.props.index]
		const model = OboModel.models[item.id]

		newContent.title = this.renamePage(item.id, model.title, newContent.title) // causes store update
		if (newContent.title === '') return 'Module title must not be empty!'
		model.triggers = newContent.triggers || []

		model.set({ content: newContent }) // may cause store update?
		EditorUtil.setStartPage(newContent.start)
	}

	render() {
		const { index, list } = this.props
		const item = list[index]
		const model = OboModel.models[item.id]

		const contentDescription = [
			{
				name: 'title',
				description: 'Title',
				placeholder: 'Module Title',
				type: 'input',
				required: true
			},
			{
				name: 'start',
				description: 'Start Page',
				type: 'select',
				values: list
					.filter(item => item.type === 'link')
					.map(item => ({
						value: item.id,
						description: item.label
					}))
			}
		]

		return (
			<li key={index} className={'heading is-not-selected'}>
				{this.renderLabel(item.label)}
				<MoreInfoBox
					id={item.id}
					type={model.get('type')}
					content={model.get('content')}
					saveId={this.saveId}
					saveContent={this.saveContent}
					savePage={this.props.savePage}
					contentDescription={contentDescription}
					markUnsaved={this.props.markUnsaved}
					hideButtonBar
				/>
			</li>
		)
	}
}

export default Header
