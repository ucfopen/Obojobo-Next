import './editor-nav.scss'
// relies on styles from viewer
import '../../../viewer/components/nav.scss'

import Common from 'obojobo-document-engine/src/scripts/common'
import EditorUtil from '../../util/editor-util'
import React from 'react'
import SubMenu from './sub-menu'
import Header from './header'
import MoreInfoBox from './more-info-box'
import isOrNot from 'obojobo-document-engine/src/scripts/common/util/isornot'
import generatePage from '../../documents/generate-page'
import generateAssessment from '../../documents/generate-assessment'

import {
	getTriggersWithActionsAdded,
	getTriggersWithActionsRemoved,
	hasTriggerTypeWithActionType
} from '../../../common/util/trigger-util'

const { Prompt, Dialog } = Common.components.modal
const { ModalUtil } = Common.util
const { OboModel } = Common.models

class EditorNav extends React.PureComponent {
	constructor(props) {
		super(props)

		this.state = {
			model: 0,
			item: null,
			index: 1,
			showMoreInfoBox: false,
			heightList: []
		}

		// optimization - bind once instead of every render
		this.showAddPageModal = this.showAddPageModal.bind(this)
		this.showAddAssessmentModal = this.showAddAssessmentModal.bind(this)
		this.addAssessment = this.addAssessment.bind(this)
		this.addPage = this.addPage.bind(this)

		this.updateSelectedSubMenu = this.updateSelectedSubMenu.bind(this)
		this.saveId = this.saveId.bind(this)
		this.saveContent = this.saveContent.bind(this)
		this.showDeleteModal = this.showDeleteModal.bind(this)
		this.duplicatePage = this.duplicatePage.bind(this)
		this.movePage = this.movePage.bind(this)

		this.unmountMoreInfoBox = this.unmountMoreInfoBox.bind(this)

		this.updateHeightList = this.updateHeightList.bind(this)
	}

	updateHeightList(height) {
		const heights = this.state.heightList
		heights.push(height)
		this.setState({ heightList: heights })
	}

	onNavItemClick(item, index) {
		this.setState({ index, showMoreInfoBox: false })
		EditorUtil.goto(item.id)
	}

	showAddAssessmentModal() {
		ModalUtil.show(
			<Prompt
				title="Add Assessment"
				message="Enter the title for the new assessment:"
				onConfirm={this.addAssessment}
			/>
		)
	}

	addAssessment(name = 'Assessment') {
		ModalUtil.hide()

		const newAssessment = generateAssessment()
		newAssessment.content.title = this.isWhiteSpace(name) ? 'Assessment' : name
		EditorUtil.addAssessment(newAssessment)
	}

	showAddPageModal() {
		ModalUtil.show(
			<Prompt
				title="Add Page"
				message="Enter the title for the new page:"
				onConfirm={this.addPage}
			/>
		)
	}

	addPage(title = null) {
		ModalUtil.hide()

		const newPage = generatePage()
		newPage.content.title = this.isWhiteSpace(title) ? null : title
		EditorUtil.addPage(newPage)
	}

	isWhiteSpace(str) {
		return !/[\S]/.test(str)
	}

	renderAddAssessmentButton() {
		return (
			<button className={'add-node-button'} onClick={this.showAddAssessmentModal}>
				+ Add Assessment
			</button>
		)
	}

	lockValue(content) {
		const startAttemptLock = hasTriggerTypeWithActionType(
			content.triggers,
			'onStartAttempt',
			'nav:lock'
		)
		const endAttemptUnlock = hasTriggerTypeWithActionType(
			content.triggers,
			'onEndAttempt',
			'nav:unlock'
		)

		return startAttemptLock && endAttemptUnlock
	}

	onChangeLock(content, isNavLock) {
		let triggers
		if (isNavLock) {
			triggers = getTriggersWithActionsAdded(content.triggers || [], {
				onStartAttempt: { type: 'nav:lock' },
				onEndAttempt: { type: 'nav:unlock' }
			})
		} else if (content.triggers) {
			triggers = getTriggersWithActionsRemoved(content.triggers, {
				onStartAttempt: 'nav:lock',
				onEndAttempt: 'nav:unlock'
			})
		}

		return { ...content, triggers }
	}

	saveId(oldId, newId) {
		if (!newId) {
			return 'Please enter an id'
		}

		const model = OboModel.models[oldId]

		if (!model.setId(newId)) {
			return 'The id "' + newId + '" already exists. Please choose a unique id'
		}

		EditorUtil.rebuildMenu(OboModel.getRoot())
	}

	saveContent(oldContent, newContent) {
		const list = EditorUtil.getOrderedList(this.props.navState)
		const item = list[this.state.index]
		const model = OboModel.models[item.id]

		model.set({ content: newContent })
		model.triggers = newContent.triggers ? newContent.triggers : []
		model.title =
			newContent.title || model.title ? this.renamePage(item.id, newContent.title) : null
	}

	renamePage(pageId, label) {
		// Fix page titles that are whitespace strings
		if (!/[^\s]/.test(label)) label = null

		EditorUtil.renamePage(pageId, label)
		return label
	}

	showDeleteModal() {
		const list = EditorUtil.getOrderedList(this.props.navState)
		const item = list[this.state.index]

		ModalUtil.show(
			<Dialog
				centered
				buttons={[
					{
						value: 'Cancel',
						altAction: true,
						onClick: ModalUtil.hide
					},
					{
						value: 'Yes, Delete',
						onClick: this.deletePage,
						default: true,
						isDangerous: true
					}
				]}
				title={'Delete ' + item.label}
			>
				{'Are you sure you want to delete ' +
					item.label +
					'? This will permanently delete all content in the page'}
			</Dialog>
		)
	}

	duplicatePage() {
		const list = EditorUtil.getOrderedList(this.props.navState)
		const item = list[this.state.index]
		const model = OboModel.models[item.id]

		this.props.savePage()
		const clonedPage = model.clone(true).toJSON()
		// Make a shallow copy of the content, to prevent problems with two pages sharing the same content
		clonedPage.content = Object.assign({}, model.get('content'))
		clonedPage.content.title = item.label + ' - (Copy)'
		EditorUtil.addPage(clonedPage, item.id)
	}

	movePage(indexToGo, action) {
		const list = EditorUtil.getOrderedList(this.props.navState)
		const item = list[this.state.index]

		// EditorUtil.movePage(item.id, this.state.index)
		EditorUtil.movePage(item.id, indexToGo)

		if (action === 'move-up') {
			this.setState({ index: this.state.index - 1 })
		}else if (action === 'move-down') {
			this.setState({ index: this.state.index + 1 })
		}
	}

	updateSelectedSubMenu(model, item, contentDescription) {
		// Refactor it later as an inline function inside the SubMenu component.
		this.setState({ model, item, contentDescription, showMoreInfoBox: true })
	}

	unmountMoreInfoBox() {
		this.setState({ showMoreInfoBox: false })
	}

	renderItems(list) {
		// If there are no pages in the nav list, add a placeholder item
		// The placeholder will render an Add Page button
		if (
			list.filter(
				item => item.type === 'no-pages' || (item.type !== 'heading' && !item.flags.assessment)
			).length < 1
		) {
			list.splice(1, 0, {
				type: 'no-pages'
			})
		}

		return list.map((item, index) => {
			switch (item.type) {
				case 'heading':
					return (
						<Header key={index} index={index} list={list} markUnsaved={this.props.markUnsaved} />
					)
				case 'link':
					return (
						<SubMenu
							key={index}
							index={index}
							isSelected={this.props.navState.navTargetId === item.id}
							list={list}
							onClick={this.onNavItemClick.bind(this, item, index)}
							savePage={this.props.savePage}
							markUnsaved={this.props.markUnsaved}
							updateSelectedSubMenu={this.updateSelectedSubMenu}
							updateHeightList={this.updateHeightList}
						/>
					)
				case 'no-pages':
					return (
						<li key="1" className="no-pages-item">
							<button className="add-node-button" onClick={this.showAddPageModal}>
								+ Page
							</button>
						</li>
					)
				default:
					return null
			}
		})
	}

	render() {
		const className =
			'visual-editor--draft-nav ' +
			isOrNot(this.props.navState.locked, 'locked') +
			isOrNot(this.props.navState.open, 'open') +
			isOrNot(!this.props.navState.disabled, 'enabled')

		const list = EditorUtil.getOrderedList(this.props.navState)

		const containsAssessment = list.filter(item => item.flags && item.flags.assessment).length > 0

		const contentDescription = [
			{
				name: 'title',
				description: 'Title',
				type: 'input'
			}
		]

		if (this.state.item && this.state.item.flags.assessment) {
			contentDescription.push(
				{
					name: 'attempts',
					description: 'Attempts',
					type: 'input'
				},
				{
					name: 'review',
					description: 'Review',
					type: 'select',
					values: [
						{
							value: 'always',
							description: 'Always show answers in review'
						},
						{
							value: 'never',
							description: 'Never show answers in review'
						},
						{
							value: 'no-attempts-remaining',
							description: 'Show answers in review after last attempt'
						}
					]
				},
				{
					name: 'lock-nav',
					description: 'Lock Navigation During Attempts',
					type: 'abstract-toggle',
					value: this.lockValue,
					onChange: this.onChangeLock
				}
			)
		}

		let heightFromTop = this.state.heightList[this.state.index - 1]
		if (this.state.index !== 1) {
			// Apply offset because of 'new page button'
			heightFromTop -= 43 // in the absolute e.g.
		}

		return (
			<div className={className}>
				<div className='sticky'>
					<ul>{this.renderItems(list)}</ul>
					{!containsAssessment ? this.renderAddAssessmentButton() : null}
				</div>
				{this.state.showMoreInfoBox ?
					<MoreInfoBox
						id={this.state.item.id}
						index={this.state.model.getIndex()}
						isFirst={this.state.model.isFirst()}
						isLast={this.state.model.isLast()}
						type={this.state.model.get('type')}
						content={this.state.model.get('content')}
						saveId={this.saveId}
						saveContent={this.saveContent}
						savePage={this.props.savePage}
						contentDescription={contentDescription}
						deleteNode={this.showDeleteModal}
						duplicateNode={this.duplicatePage}
						markUnsaved={this.props.markUnsaved}
						moveNode={this.movePage}
						showMoveButtons={!this.state.item.flags.assessment}
						isAssessment={this.state.item.flags.assessment}
						unmountMoreInfoBox={this.unmountMoreInfoBox}
						heightFromTop={heightFromTop}
					/>
				: null}
			</div>
		)
	}
}

export default EditorNav

// Every time I click on a submenu, I want to update the MODEL, ITEM, and content state here on the editor-nav.
