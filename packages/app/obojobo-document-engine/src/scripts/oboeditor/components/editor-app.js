import '../../../scss/main.scss'
// uses viewer css for styling
import '../../viewer/components/viewer-app.scss'
import 'obojobo-modules-module/viewer-component.scss'
import './editor-app.scss'

import EditorAPI from '../../viewer/util/editor-api'
import Common from '../../common'
import CodeEditor from './code-editor'
import EditorStore from '../stores/editor-store'
import EditorUtil from '../util/editor-util'
import VisualEditor from './visual-editor'
import React from 'react'
import enableWindowCloseDispatcher from '../../common/util/close-window-dispatcher'
import ObojoboIdleTimer from '../../common/components/obojobo-idle-timer'
import SimpleDialog from '../../common/components/modal/simple-dialog'

const ModalContainer = Common.components.ModalContainer
const ModalUtil = Common.util.ModalUtil
const ModalStore = Common.stores.ModalStore
const OboModel = Common.models.OboModel
const Dispatcher = Common.flux.Dispatcher

const XML_MODE = 'xml'
const VISUAL_MODE = 'visual'

class EditorApp extends React.Component {
	constructor(props) {
		super(props)
		// store the current version id for locking
		// not stored on state because no effect on render
		this.contentId = null

		this.state = {
			model: null,
			editorState: null,
			modalState: null,
			navTargetId: null,
			loading: true,
			draftId: null,
			draft: null,
			mode: VISUAL_MODE,
			code: null,
			requestStatus: null,
			requestError: null,
			assessmentId: "my-assessment" // default id when a new module is created.
		}

		// caluclate edit lock settings
		const msPerMin = 60000
		const locks = props.settings.editLocks

		/*
		Locks are created so that only one author can be editing a draft at a time.
		Each lock is stored in the database and remains active for dbLockDurationMinutes.
		Here we renew the lock on an interval, every renewLockIntervalMs. This value must
		be shorter than dbLockDurationMinutes to ensure the lock is renewed, so after 90%
		of dbLockDurationMinutes has passed we go ahead and ask the server to renew the lock.

		Once the user has remained idle for idleTimeUntilReleaseLockMs we tell the server
		that we are releasing our lock, allowing for other authors to edit the same draft.
		A dialog is shown notifying the user that the document is in a frozen state.
		When returning from idle the lock will be renewed and authoring will continue if
		there isn't an active lock (in other words, nobody else is editing the document).
		If there IS an active lock already we display a message that the document is being
		edited and we hide the UI.

		To help prevent accidental idle periods we display a warning message if the client
		remains idle for idleTimeUntilWarningMs. This lets the author know that their lock
		will be released soon.
		*/
		this.editLocks = {
			renewLockIntervalMs: locks.dbLockDurationMinutes * 0.9 * msPerMin,
			idleTimeUntilWarningMs: locks.idleTimeUntilWarningMinutes * msPerMin,
			idleTimeUntilReleaseLockMs: locks.idleTimeUntilReleaseLockMinutes * msPerMin
		}

		// === SET UP DATA STORES ===
		this.onEditorStoreChange = () => this.setState({ editorState: EditorStore.getState() })
		this.onModalStoreChange = () => this.setState({ modalState: ModalStore.getState() })
		EditorStore.onChange(this.onEditorStoreChange)
		ModalStore.onChange(this.onModalStoreChange)

		this.switchMode = this.switchMode.bind(this)
		this.saveDraft = this.saveDraft.bind(this)
		this.onWindowClose = this.onWindowClose.bind(this)
		this.onWindowInactiveWarning = this.onWindowInactiveWarning.bind(this)
		this.onWindowReturnFromInactive = this.onWindowReturnFromInactive.bind(this)
		this.onWindowInactive = this.onWindowInactive.bind(this)
		this.updateAssessmentId = this.updateAssessmentId.bind(this)
		this.renewLockInterval = null
	}

	saveDraft(draftId, draftSrc, xmlOrJSON = 'json') {
		const mode = xmlOrJSON === 'xml' ? 'text/plain' : 'application/json'
		return EditorAPI.postDraft(draftId, draftSrc, mode)
			.then(({ contentId, result }) => {
				if (result.status !== 'ok') {
					throw Error(result.value.message)
				}

				this.contentId = contentId // keep new contentId for edit locks
				return true
			})
			.catch(e => {
				ModalUtil.show(<SimpleDialog ok title={'Error: ' + e} />)
				return false
			})
	}

	getVisualEditorState(draftId, draftModel) {
		OboModel.clearAll()
		const json = JSON.parse(draftModel)
		const obomodel = OboModel.create(json)
		EditorStore.init(
			obomodel,
			json.content.start,
			this.props.settings,
			window.location.pathname,
			this.state.mode
		)

		return {
			modalState: ModalStore.getState(),
			editorState: EditorStore.getState(),
			draftId,
			draft: json,
			model: obomodel,
			loading: false
		}
	}

	getCodeEditorState(draftId, draftModel) {
		const title = EditorUtil.getTitleFromString(draftModel, this.state.mode)
		OboModel.clearAll()
		const obomodel = OboModel.create({
			type: 'ObojoboDraft.Modules.Module',
			content: { title }
		})

		EditorStore.init(obomodel, null, this.props.settings, window.location.pathname, this.state.mode)

		return {
			modalState: ModalStore.getState(),
			editorState: EditorStore.getState(),
			code: draftModel,
			draftId,
			draft: draftModel,
			model: obomodel,
			loading: false
		}
	}

	switchMode(mode) {
		this.setState({ mode, loading: true })
		this.reloadDraft(this.state.draftId, mode)
	}

	displayLockedState(title, message) {
		// entering a unrecoverable state, stop renewing locks
		clearInterval(this.renewLockInterval)
		this.renewLockInterval = null

		this.setState({
			requestStatus: 'invalid',
			requestError: { title, message }
		})
	}

	startRenewEditLockInterval(draftId) {
		// block this function from being called again
		// while it's waiting for api calls
		if (this._isCreatingRenewableEditLock) return Promise.resolve()
		this._isCreatingRenewableEditLock = true
		return this.createEditLock(draftId, this.contentId)
			.then(() => {
				// success!
				// create the lock interval to keep checking & renewing
				clearInterval(this.renewLockInterval)
				this.renewLockInterval = setInterval(() => {
					this.createEditLock(draftId, this.contentId).catch(error => {
						this.handleEditLockError(error)
					})
				}, this.editLocks.renewLockIntervalMs)
				// end code that happens on interval
			})
			.catch(error => {
				// unable to lock on initial run
				// note this will not capture errors thrown inside the interval
				this.handleEditLockError(error)
			})
			.then(() => {
				// unblock so function to be called again
				this._isCreatingRenewableEditLock = false
			})
	}

	handleEditLockError(error) {
		this.displayLockedState('Unable to Edit Module', error.message)
	}

	createEditLock(draftId, contentId) {
		return EditorAPI.requestEditLock(draftId, contentId).then(json => {
			if (json.status === 'error') {
				const msg = json.value && json.value.message ? json.value.message : 'Unable to lock module.'
				throw Error(msg)
			}
		})
	}

	reloadDraft(draftId, mode) {
		return EditorAPI.getFullDraft(draftId, mode === VISUAL_MODE ? 'json' : mode)
			.then(({ contentId, body }) => {
				this.contentId = contentId
				switch (mode) {
					case XML_MODE:
						return body

					default: // block added for scoping vars to the default case
					{
						// parse json response that contains the draft json
						const json = JSON.parse(body)
						// check the api status
						if (json.status === 'error') {
							const error = Error(json.value.message)
							error.type = json.value.type
							throw error
						}
						// stringify and format the draft data
						return JSON.stringify(json.value, null, 4)
					}
				}
			})
			.then(draft => {
				const editorState =
					mode === VISUAL_MODE
						? this.getVisualEditorState(draftId, draft)
						: this.getCodeEditorState(draftId, draft)
				return this.setState({ ...editorState, mode })
			})
			.catch(err => {
				// eslint-disable-next-line no-console
				console.error(err)
				this.setState({ requestStatus: 'invalid', requestError: err, mode })
				throw err
			})
	}

	loadDraftRevision(draftId, revisionId) {
		const mode = 'visual'

		return EditorAPI.getDraftRevision(draftId, revisionId)
			.then(response => {
				if (response.status === 'error') {
					const error = Error(response.value.message)
					error.type = response.value.type
					throw error
				}

				return JSON.stringify(response.value.json, null, 4)
			})
			.then(draftModel => {
				this.setState({ ...this.getVisualEditorState(draftId, draftModel), mode })
			})
			.catch(err => {
				// eslint-disable-next-line no-console
				console.error(err)
				this.setState({ requestStatus: 'invalid', requestError: err, mode })
			})
	}

	componentDidMount() {
		const urlTokens = document.location.pathname.split('/')
		const revisionId = this.props.settings && this.props.settings.revisionId

		// get draftID from location
		const draftId = urlTokens[3] ? urlTokens[3] : null

		ModalStore.init()

		if (revisionId) {
			// If this is a revision, load it in the editor. Note that
			// revisions will always load in visual mode
			// currently this used for viewing version history
			return this.loadDraftRevision(draftId, revisionId)
		}

		return this.reloadDraft(draftId, this.state.mode)
			.then(() => this.startRenewEditLockInterval(draftId))
			.then(() => {
				enableWindowCloseDispatcher()
				Dispatcher.on('window:closeNow', this.onWindowClose)

				Dispatcher.on('window:inactiveWarning', this.onWindowInactiveWarning)
				Dispatcher.on('window:returnFromInactiveWarning', this.onWindowReturnFromInactive)
				Dispatcher.on('window:inactive', this.onWindowInactive)
				Dispatcher.on('window:returnFromInactive', this.onWindowReturnFromInactive)
			})
			.catch(() => {})
	}

	onWindowClose() {
		EditorAPI.deleteLockBeacon(this.state.draftId)
	}

	onWindowInactive() {
		EditorAPI.deleteLockBeacon(this.state.draftId)
		clearInterval(this.renewLockInterval)
		this.renewLockInterval = null
		ModalUtil.hide()
		ModalUtil.show(
			<SimpleDialog ok title="Editor Session Expired">
				Collaborators may edit this module while you&apos;re away. We&apos;ll attempt to renew your
				session when you return.
			</SimpleDialog>
		)
	}

	onWindowInactiveWarning() {
		ModalUtil.show(
			<SimpleDialog ok title="Editor Idle Warning">
				Interact with this window soon to keep your edit session.
			</SimpleDialog>
		)
	}

	onWindowReturnFromInactive() {
		return this.startRenewEditLockInterval(this.state.draftId).then(() => {
			ModalUtil.hide()
		})
	}

	componentWillUnmount() {
		clearInterval(this.renewLockInterval)
		EditorStore.offChange(this.onEditorStoreChange)
		ModalStore.offChange(this.onModalStoreChange)
	}

	updateAssessmentId(assessmentId) {
		this.setState({ assessmentId })
	}

	renderCodeEditor() {
		return (
			<CodeEditor
				initialCode={this.state.code}
				model={this.state.model}
				draftId={this.state.draftId}
				mode={this.state.mode}
				switchMode={this.switchMode}
				insertableItems={Common.Registry.insertableItems}
				saveDraft={this.saveDraft}
			/>
		)
	}

	renderVisualEditor() {
		return (
			<VisualEditor
				page={this.state.editorState.currentPageModel}
				navState={this.state.editorState}
				context={this.state.editorState.context}
				model={this.state.model}
				draft={this.state.draft}
				draftId={this.state.draftId}
				switchMode={this.switchMode}
				insertableItems={Common.Registry.insertableItems}
				saveDraft={this.saveDraft}
				readOnly={
					// Prevents editing a draft that's a revision,
					// even if the url was visited manually
					this.props.settings && (this.props.settings.readOnly || this.props.settings.revisionId)
				}
				updateAssessmentId={this.updateAssessmentId}
			/>
		)
	}

	render() {
		if (this.state.requestStatus === 'invalid') {
			return (
				<div className="viewer--viewer-app--visit-error">
					<h1>{this.state.requestError.title || 'Error'}</h1>
					{this.state.requestError.type ? <h2>{this.state.requestError.type}</h2> : null}
					<div>{this.state.requestError.message}</div>
				</div>
			)
		}

		if (this.state.loading) return <p>Loading</p>

		const modalItem = ModalUtil.getCurrentModal(this.state.modalState)
		return (
			<div className="visual-editor--editor-app">
				<ObojoboIdleTimer
					timeout={this.editLocks.idleTimeUntilReleaseLockMs}
					warning={this.editLocks.idleTimeUntilWarningMs}
				/>
				{this.state.mode === VISUAL_MODE ? this.renderVisualEditor() : this.renderCodeEditor()}
				{modalItem && modalItem.component ? (
					<ModalContainer assessmentId={this.state.assessmentId}>
						{modalItem.component}
					</ModalContainer>
				) : null}
			</div>
		)
	}
}

export default EditorApp
