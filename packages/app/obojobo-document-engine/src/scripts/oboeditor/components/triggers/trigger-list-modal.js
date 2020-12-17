import './trigger-list-modal.scss'

import Common from 'obojobo-document-engine/src/scripts/common'
import React from 'react'

const { SimpleDialog } = Common.components.modal
const { Button, Switch } = Common.components

const ASSESSMENT_TRIGGER_START_ATTEMPT = 'assessment:startAttempt'
const ASSESSMENT_TRIGGER_END_ATTEMPT = 'assessment:endAttempt'

class TriggerListModal extends React.Component {
	constructor(props) {
		super(props)
		this.inputRef = React.createRef()
		this.state = {
			...JSON.parse(JSON.stringify(props.content)),
			invalidAssessmentIdError: ""
		}
		if (!this.state.triggers) this.state.triggers = []

		this.createTrigger = this.createTrigger.bind(this)
		this.validateSetTriggers = this.validateSetTriggers.bind(this)
	}

	componentWillUnmount() {
		if (this.props.onClose) this.props.onClose()
	}

	componentDidMount() {
		this.validateSetTriggers()
	}

	validateSetTriggers() {
		// Testing if the set assessment id prop is getting here:
		this.state.triggers.forEach(trigger => {
			trigger.actions.forEach(action => {
				if (action.type === ASSESSMENT_TRIGGER_START_ATTEMPT ||
					action.type === ASSESSMENT_TRIGGER_END_ATTEMPT) {
						
					if (action.value.id !== this.props.assessmentId) {
						// Then, the assessment with the id 'action.value.id' does
						// not exist.
						this.setState({
							invalidAssessmentIdError: 'One of the assessment IDs above does not exist'
						})
					}
				}
			})
		})
	}

	updateTriggerType(index, event) {
		const type = event.target.value

		// Update triggers[triggerIndex].type
		// The nested loop insures that React's immutable state is updated properly
		return this.setState(prevState => ({
			triggers: prevState.triggers.map((trigger, listIndex) =>
				index === listIndex ? Object.assign(trigger, { type }) : trigger
			)
		}))
	}

	deleteTrigger(index) {
		// The nested loop insures that React's immutable state is updated properly
		return this.setState(prevState => ({
			triggers: prevState.triggers
				.map((trigger, listIndex) => (index === listIndex ? null : trigger))
				.filter(Boolean)
		}))
	}

	createTrigger() {
		// The nested loop insures that React's immutable state is updated properly
		return this.setState(prevState => ({
			triggers: prevState.triggers.concat({
				type: 'onMount',
				actions: [
					{
						type: 'nav:goto',
						value: {}
					}
				]
			})
		}))
	}

	createNewDefaultActionValueObject(type) {
		switch (type) {
			case 'nav:goto':
			case 'assessment:startAttempt':
			case 'assessment:endAttempt':
				return {
					id: ''
				}

			case 'nav:openExternalLink':
				return {
					url: ''
				}

			case 'viewer:alert':
				return {
					title: '',
					message: ''
				}

			case 'viewer:scrollToTop':
				return {
					animateScroll: true
				}

			case 'focus:component':
				return {
					id: '',
					fade: false,
					animateScroll: true
				}

			default:
				return {}
		}
	}

	updateActionType(triggerIndex, actionIndex, event) {
		const type = event.target.value

		// Update triggers[triggerIndex].actions[actionIndex].type
		// The nested loops insure that React's immutable state is updated properly
		return this.setState(prevState => ({
			/* eslint-disable no-mixed-spaces-and-tabs */
			triggers: prevState.triggers.map((trigger, tIndex) =>
				triggerIndex === tIndex
					? Object.assign(trigger, {
							actions: trigger.actions.map((action, aIndex) =>
								actionIndex === aIndex
									? Object.assign(action, {
											type,
											value: this.createNewDefaultActionValueObject(type)
									  })
									: action
							)
					  })
					: trigger
			)
		}))
	}

	updateActionValue(triggerIndex, actionIndex, key, event) {
		const value = {}
		// If there is a target, event is actually an event
		// If there is no target, event is a boolean produced by the Switch
		value[key] = event.target ? event.target.value : event

		// Update triggers[triggerIndex].actions[actionIndex].value.key
		// The nested loops insure that React's immutable state is updated properly
		return this.setState(prevState => ({
			/* eslint-disable no-mixed-spaces-and-tabs */
			triggers: prevState.triggers.map((trigger, tIndex) =>
				triggerIndex === tIndex
					? Object.assign(trigger, {
							actions: trigger.actions.map((action, aIndex) =>
								actionIndex === aIndex
									? Object.assign(action, {
											value: Object.assign({}, action.value, value)
									  })
									: action
							)
					  })
					: trigger
			)
		}))
	}

	deleteAction(triggerIndex, actionIndex) {
		// Delete triggers[triggerIndex].actions[actionIndex]
		return this.setState(prevState => ({
			triggers: prevState.triggers.map((trigger, tIndex) =>
				triggerIndex === tIndex
					? Object.assign(trigger, {
							actions: trigger.actions
								.map((action, aIndex) => (actionIndex === aIndex ? null : action))
								.filter(Boolean)
					  })
					: trigger
			)
		}))
	}

	createAction(triggerIndex) {
		// Create a new action in triggers[triggerIndex].actions
		return this.setState(prevState => ({
			triggers: prevState.triggers.map((trigger, tIndex) =>
				triggerIndex === tIndex
					? Object.assign(trigger, {
							actions: trigger.actions.concat({
								type: 'nav:goto',
								value: {}
							})
					  })
					: trigger
			)
		}))
	}

	renderActionOptions(triggerIndex, actionIndex, action) {
		switch (action.type) {
			case 'nav:goto':
				return (
					<div className="action-options">
						<div>
							<label>Item Id</label>
							<input
								className="input-item"
								value={action.value.id || ''}
								onChange={this.updateActionValue.bind(this, triggerIndex, actionIndex, 'id')}
							/>
						</div>
					</div>
				)
			case 'nav:openExternalLink':
				return (
					<div className="action-options">
						<div>
							<label>URL</label>
							<input
								className="input-item"
								value={action.value.url || ''}
								onChange={this.updateActionValue.bind(this, triggerIndex, actionIndex, 'url')}
							/>
						</div>
					</div>
				)
			case 'assessment:startAttempt':
			case 'assessment:endAttempt':
				return (
					<div className="action-options">
						<div>
							<label>Assessment Id</label>
							<input
								className="input-item"
								value={action.value.id || ''}
								onChange={this.updateActionValue.bind(this, triggerIndex, actionIndex, 'id')}
							/>
						</div>
					</div>
				)
			case 'viewer:alert':
				return (
					<div className="action-options">
						<div>
							<label>Title</label>
							<input
								className="input-item"
								value={action.value.title || ''}
								onChange={this.updateActionValue.bind(this, triggerIndex, actionIndex, 'title')}
							/>
						</div>
						<div>
							<label>Message</label>
							<input
								className="input-item"
								value={action.value.message || ''}
								onChange={this.updateActionValue.bind(this, triggerIndex, actionIndex, 'message')}
							/>
						</div>
					</div>
				)
			case 'viewer:scrollToTop':
				return (
					<div className="action-options">
						<Switch
							title="Animate Scroll"
							initialChecked={action.value.animateScroll}
							handleCheckChange={this.updateActionValue.bind(
								this,
								triggerIndex,
								actionIndex,
								'animateScroll'
							)}
						/>
					</div>
				)
			case 'focus:component':
				return (
					<div className="action-options">
						<div>
							<label>Item Id</label>
							<input
								className="input-item"
								value={action.value.id || ''}
								onChange={this.updateActionValue.bind(this, triggerIndex, actionIndex, 'id')}
							/>
						</div>
						<Switch
							title="Fade Out Other Items"
							initialChecked={action.value.fade || false}
							handleCheckChange={this.updateActionValue.bind(
								this,
								triggerIndex,
								actionIndex,
								'fade'
							)}
						/>
						<Switch
							title="Animate Scroll"
							initialChecked={action.value.animateScroll || false}
							handleCheckChange={this.updateActionValue.bind(
								this,
								triggerIndex,
								actionIndex,
								'animateScroll'
							)}
						/>
					</div>
				)
		}
	}

	render() {
		return (
			<SimpleDialog ok title="Triggers" onConfirm={() => this.props.onClose(this.state)}>
				<div className="trigger-list-modal">
					{this.state.triggers.map((trigger, triggerIndex) => (
						<div className="trigger" key={triggerIndex}>
							<label>When</label>
							<select
								className="select-item"
								value={trigger.type}
								onChange={this.updateTriggerType.bind(this, triggerIndex)}
							>
								<option value="onMount">This item is shown</option>
								<option value="onUnmount">This item is hidden</option>
								<option value="onNavEnter">The student enters the page</option>
								<option value="onNavExit">The student leaves the page</option>
								<option value="onStartAttempt">An assessment attempt starts</option>
								<option value="onEndAttempt">An assessment attempt ends</option>
								<option value="onClick">The student clicks the button</option>
							</select>
							<button
								className="delete-button"
								onClick={this.deleteTrigger.bind(this, triggerIndex)}
							>
								×
							</button>
							{trigger.actions.map((action, actionIndex) => (
								<div className="action" key={actionIndex}>
									<button className="drag-button" />
									<label>Then</label>
									<select
										className="select-item"
										value={action.type}
										onChange={this.updateActionType.bind(this, triggerIndex, actionIndex)}
									>
										<option value="nav:goto">Go to</option>
										<option value="nav:prev">Go to the previous page</option>
										<option value="nav:next">Go to the next page</option>
										<option value="nav:openExternalLink">Open a webpage</option>
										<option value="nav:lock">Lock navigation</option>
										<option value="nav:unlock">Unlock navigation</option>
										<option value="nav:open">Open the navigation menu</option>
										<option value="nav:close">Close the navigation menu</option>
										<option value="nav:toggle">Toggle the navigation menu</option>
										<option value="assessment:startAttempt">Start an attempt for</option>
										<option value="assessment:endAttempt">End an attempt for</option>
										<option value="viewer:alert">Display a popup message</option>
										<option value="viewer:scrollToTop">Scroll to the top of the page</option>
										<option value="focus:component">Focus on a specific item</option>
									</select>
									<button
										className="delete-button"
										onClick={this.deleteAction.bind(this, triggerIndex, actionIndex)}
									>
										×
									</button>
									{this.renderActionOptions(triggerIndex, actionIndex, action)}
								</div>
							))}
							<div>
								<Button onClick={this.createAction.bind(this, triggerIndex)}>+ Add Action</Button>
							</div>
						</div>
					))}
					<Button onClick={this.createTrigger}>+ Add Trigger</Button>
					<span className="trigger-error">{this.state.invalidAssessmentIdError}</span>
				</div>
			</SimpleDialog>
		)
	}
}

export default TriggerListModal
