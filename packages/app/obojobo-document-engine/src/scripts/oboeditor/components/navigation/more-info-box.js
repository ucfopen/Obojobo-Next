import './more-info-box.scss'

import ClipboardUtil from '../../util/clipboard-util'
import Common from 'obojobo-document-engine/src/scripts/common'
import React from 'react'

import MoreInfoIcon from '../../assets/more-info-icon'
import TriggerListModal from '../triggers/trigger-list-modal'

const { Button, Switch } = Common.components
const { TabTrap } = Common.components.modal
const { ModalUtil } = Common.util

// convenience function to reduce function creation in render
const stopPropagation = event => event.stopPropagation()

// Expected Props:
// id: String - the id of the item to edit
// content: Object - the item data for the node.  Each key-value pair would be edited independantly
// saveId: Function(oldId, newId) - updates the id.  Returns a string error if the id couldn't save
// saveContent: Function(oldContent, newContent) - updates the content. Returns a string error if the content is invalid
// contentDescription: [Object] - a list of descriptions that tells which content attributes to display and how
// 			Each description should have a name, a description, and a type
// markUnsaved: Function() - marks the editor content as unsaved
class MoreInfoBox extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			currentId: this.props.id,
			needsUpdate: false,
			error: null,
			isOpen: false,
			modalOpen: false,
			content: this.props.content
		}

		this.onWindowMouseDown = this.onWindowMouseDown.bind(this)
		this.onKeyDown = this.onKeyDown.bind(this)

		this.toggleOpen = this.toggleOpen.bind(this)
		this.close = this.close.bind(this)

		this.handleIdChange = this.handleIdChange.bind(this)
		this.onSave = this.onSave.bind(this)

		this.showTriggersModal = this.showTriggersModal.bind(this)
		this.closeModal = this.closeModal.bind(this)

		this.renderInfoBox = this.renderInfoBox.bind(this)

		this.domRef = React.createRef()
		this.idInput = React.createRef()
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.onWindowMouseDown, false)
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.onWindowMouseDown, false)
		this.close()
	}

	componentDidUpdate(prevProps, prevState) {
		// When props.open changes to open, update state and re-render
		const isOpeningByProps = this.props.open && this.props.open !== prevProps.open
		if (isOpeningByProps) {
			this.setState({ isOpen: true })
			return
		}

		// when opening, focus/select the first input for keyboard users
		const isOpening = this.state.isOpen && this.state.isOpen !== prevState.isOpen
		if (isOpening) {
			this.idInput.current.focus()
			setTimeout(() => {
				this.idInput.current.select()
			}, 200)
		}

		// If the component's content is updated we want to update our data
		// (This can happen, for example, when updating triggers from the ActionButton's
		// onClick shortcut menu)
		if (prevProps.content !== this.props.content) {
			this.setState({
				content: this.props.content
			})
		}
	}

	onWindowMouseDown(event) {
		// do nothing if...
		if (!this.state.isOpen) return // not open
		if (this.state.modalOpen) return // modal is open
		if (!this.domRef.current) return // not currently rendered on the dom
		if (this.domRef.current.contains(event.target)) return // clicked inside this element

		// When the click is outside the box, close the box
		return this.onSave()
	}

	onKeyDown(event) {
		if (event.key === 'Escape') {
			return this.onSave()
		}
	}

	handleIdChange(event) {
		const currentId = event.target.value
		return this.setState({ currentId, needsUpdate: true })
	}

	handleContentChange(key, event) {
		stopPropagation(event)
		const newContent = {}
		newContent[key] = event.target.value

		this.setState(prevState => ({
			content: Object.assign({}, prevState.content, newContent),
			needsUpdate: true
		}))
	}

	handleSwitchChange(key, event) {
		const newContent = {}
		newContent[key] = event.target.checked

		this.setState(prevState => ({
			content: Object.assign(prevState.content, newContent)
		}))
	}

	handleAbstractToggleChange(changeFn, event) {
		const enabled = event.target.checked // must be stored because target becomes null before setState callback is called
		this.setState(prevState => ({ content: changeFn(prevState.content, enabled) }))
	}

	onSave() {
		// Save the internal content to the editor state
		const error =
			this.props.saveContent(this.props.content, this.state.content) ||
			this.props.saveId(this.props.id, this.state.currentId)
		if (!error) {
			this.setState({ error })
			this.props.markUnsaved()
			this.close()
			return
		}

		this.setState({ error })
	}

	toggleOpen(event) {
		stopPropagation(event)

		if (this.state.isOpen) {
			if (this.state.needsUpdate) {
				this.onSave()
			} else {
				this.close()
			}
		} else {
			this.setState({ isOpen: true })
			if (this.props.onOpen) this.props.onOpen()
		}
	}

	close() {
		if (this.state.isOpen === true) {
			if (this.props.onBlur) this.props.onBlur('info')
			this.setState({ isOpen: false })
			// this.props.unmountMoreInfoBox()
		}
	}

	showTriggersModal() {
		// Prevent info box from closing when modal is opened
		ModalUtil.show(<TriggerListModal content={this.state.content} onClose={this.closeModal} />)
		this.setState({ modalOpen: true })
	}

	// TriggerListModal.onClose is called w/ no arguments when canceled
	// TriggerListModal.onClose is called w/ triggers when save+closed
	closeModal(modalState) {
		ModalUtil.hide()

		if (!modalState) return // do not save changes

		this.setState(prevState => ({
			content: { ...prevState.content, triggers: modalState.triggers },
			needsUpdate: true,
			modalOpen: false
		}))

		this.props.unmountMoreInfoBox()
	}

	renderItem(item) {
		switch (item.type) {
			case 'input':
				return (
					<div className="properties--row" key={item.description}>
						<label htmlFor={item.description}>{item.description}</label>
						<input
							id={item.description}
							type="text"
							value={this.state.content[item.name]}
							onChange={this.handleContentChange.bind(this, item.name)}
							placeholder={item.placeholder || ''}
							onClick={stopPropagation}
							maxLength="300"
						/>
					</div>
				)
			case 'select':
				return (
					<div className="properties--row" key={item.description}>
						<label htmlFor={item.description}>{item.description}</label>
						<select
							id={item.description}
							className="select-item"
							value={this.state.content[item.name]}
							onChange={this.handleContentChange.bind(this, item.name)}
							onClick={stopPropagation}
						>
							{item.values.map(option => (
								<option value={option.value} key={option.value}>
									{option.description}
								</option>
							))}
						</select>
					</div>
				)
			case 'toggle':
				return (
					<Switch
						key={item.description}
						title={item.description}
						checked={this.state.content[item.name]}
						onChange={this.handleSwitchChange.bind(this, item.name)}
					/>
				)
			// Toggles complex things, like Lock Nav during Assessment Attempt
			case 'abstract-toggle':
				return (
					<Switch
						key={item.description}
						title={item.description}
						checked={item.value(this.state.content)}
						onChange={this.handleAbstractToggleChange.bind(this, item.onChange)}
					/>
				)
			case 'button':
				return (
					<div key={item.description}>
						<label>{item.description}</label>
						<Button altAction onClick={item.action}>
							{item.name}
						</Button>
					</div>
				)
		}
	}

	renderInfoBox() {
		const triggers = this.state.content.triggers

		return (
			<div className="more-info-box">
				<div className="container">
					<TabTrap focusOnFirstElement={() => this.idInput.current.focus()}>
						<div className="properties">
							<div>{this.props.type}</div>
							<div>
								<div className="properties--row">
									<label htmlFor="oboeditor--components--more-info-box--id-input">Id</label>
									<input
										autoFocus
										type="text"
										id="oboeditor--components--more-info-box--id-input"
										value={this.state.currentId}
										onChange={this.handleIdChange}
										className="id-input"
										onClick={stopPropagation}
										ref={this.idInput}
									/>
									<Button onClick={() => ClipboardUtil.copyToClipboard(this.state.currentId)}>
										Copy Id
									</Button>
								</div>
								{this.props.contentDescription.map(description => this.renderItem(description))}
							</div>
							<div>
								<span className="triggers">
									Triggers:
									{triggers && triggers.length > 0 ? (
										<span>
											{triggers
												.map(trigger => trigger.type)
												.reduce((accum, trigger) => accum + ', ' + trigger)}
										</span>
									) : null}
								</span>
								<Button altAction className="trigger-button" onClick={this.showTriggersModal}>
									✎ Edit
								</Button>
							</div>
							{this.props.hideButtonBar ? null : (
								<div className="button-bar">
									<Button altAction isDangerous onClick={this.props.deleteNode}>
										Delete
									</Button>
									{!this.props.isAssessment ? (
										<Button altAction onClick={this.props.duplicateNode}>
											Duplicate
										</Button>
									) : null}
									{!this.props.showMoveButtons ? null : (
										<Button
											disabled={this.props.isFirst}
											altAction
											onClick={() => this.props.moveNode(this.props.index - 1, 'move-up')}
										>
											Move Up
										</Button>
									)}
									{!this.props.showMoveButtons ? null : (
										<Button
											disabled={this.props.isLast}
											altAction
											onClick={() => this.props.moveNode(this.props.index + 1, 'move-down')}
										>
											Move Down
										</Button>
									)}
								</div>
							)}
						</div>
						<div className="box-controls">
							{this.state.error ? <p className="error">{this.state.error}</p> : null}
							<Button onClick={this.onSave} className="cancel-button">
								Done
							</Button>
						</div>
					</TabTrap>
				</div>
			</div>
		)
	}

	render() {
		return (
			<div
				ref={this.domRef}
				className={'visual-editor--more-info ' + (this.props.className || '')}
				onKeyDown={this.onKeyDown}
				style={{ top: `${this.props.heightFromTop}px` }}
			>
				<button
					className={'more-info-button ' + (this.state.isOpen ? 'is-open' : '')}
					onClick={this.toggleOpen}
					tabIndex={this.props.tabIndex || 0}
					aria-label="Toggle More Info Box"
				>
					<MoreInfoIcon />
				</button>
				{this.state.isOpen ? this.renderInfoBox() : null}
			</div>
		)
	}
}

export default MoreInfoBox
