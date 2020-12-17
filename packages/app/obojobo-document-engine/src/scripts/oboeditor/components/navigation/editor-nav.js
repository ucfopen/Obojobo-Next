import './editor-nav.scss'
// relies on styles from viewer
import '../../../viewer/components/nav.scss'

import Common from 'obojobo-document-engine/src/scripts/common'
import EditorUtil from '../../util/editor-util'
import React from 'react'
import SubMenu from './sub-menu'
import Header from './header'
import isOrNot from 'obojobo-document-engine/src/scripts/common/util/isornot'
import generatePage from '../../documents/generate-page'
import generateAssessment from '../../documents/generate-assessment'

const { Prompt } = Common.components.modal
const { ModalUtil } = Common.util

class EditorNav extends React.PureComponent {
	constructor(props) {
		super(props)

		// optimization - bind once instead of every render
		this.showAddPageModal = this.showAddPageModal.bind(this)
		this.showAddAssessmentModal = this.showAddAssessmentModal.bind(this)
		this.addAssessment = this.addAssessment.bind(this)
		this.addPage = this.addPage.bind(this)
	}

	onNavItemClick(item) {
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
							onClick={this.onNavItemClick.bind(this, item)}
							savePage={this.props.savePage}
							markUnsaved={this.props.markUnsaved}
							updateAssessmentId={this.props.updateAssessmentId}
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

		return (
			<div className={className}>
				<ul>{this.renderItems(list)}</ul>
				{!containsAssessment ? this.renderAddAssessmentButton() : null}
			</div>
		)
	}
}

export default EditorNav
