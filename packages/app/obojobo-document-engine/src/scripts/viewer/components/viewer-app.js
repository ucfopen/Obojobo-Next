import '../../../scss/main.scss'
import './viewer-app.scss'

import ViewerAPI from '../util/viewer-api'
import AssessmentStore from '../stores/assessment-store'
import Common from 'Common'
import FocusStore from '../stores/focus-store'
import FocusUtil from '../util/focus-util'
import Header from './header'
import ObojoboIdleTimer from '../../common/components/obojobo-idle-timer'
import InlineNavButton from './inline-nav-button'
import MediaStore from '../stores/media-store'
import Nav from './nav'
import NavStore from '../stores/nav-store'
import NavUtil from '../util/nav-util'
import QuestionStore from '../stores/question-store'
import React from 'react'
import ReactDOM from 'react-dom'
import getLTIOutcomeServiceHostname from '../util/get-lti-outcome-service-hostname'
import enableWindowCloseDispatcher from '../../common/util/close-window-dispatcher'
import injectKatexIfNeeded from '../../common/util/inject-katex-if-needed'

const NAV_CLOSE_DURATION_MS = 400
const IDLE_TIMEOUT_DURATION_MS = 60000 * 30 // 30 minutes in milliseconds

const { focus } = Common.page
const { OboModel } = Common.models
const { Dispatcher } = Common.flux
const { FocusBlocker, ModalContainer } = Common.components
const { ModalUtil, isOrNot } = Common.util
const SimpleDialog = Common.components.modal.SimpleDialog
const ModalStore = Common.stores.ModalStore

Dispatcher.on('viewer:alert', payload =>
	ModalUtil.show(
		<SimpleDialog ok title={payload.value.title}>
			{payload.value.message}
		</SimpleDialog>
	)
)

export default class ViewerApp extends React.Component {
	constructor(props) {
		super(props)

		this.navRef = React.createRef()
		this.containerRef = React.createRef()

		Dispatcher.on('viewer:scrollToTop', payload => {
			this.scrollToTop(payload && payload.value ? payload.value.animateScroll : false)
		})
		Dispatcher.on('window:closeNow', this.sendCloseEvent.bind(this))
		Dispatcher.on('getTextForVariable', this.getTextForVariable.bind(this))
		Dispatcher.on('window:inactive', this.onIdle.bind(this))
		Dispatcher.on('window:returnFromInactive', this.onReturnFromIdle.bind(this))

		this.state = {
			model: null,
			loading: true,
			requestStatus: 'unknown',
			isPreviewing: false,
			lti: { outcomeServiceHostname: null },
			viewSessionId: null
		}

		// setup store listeners
		// be sure to unregister stores on unMount
		this.stores = {}
		this.storeListeners = {}
		this.registerStore(NavStore, 'navState')
		this.registerStore(QuestionStore, 'questionState')
		this.registerStore(AssessmentStore, 'assessmentState')
		this.registerStore(ModalStore, 'modalState')
		this.registerStore(FocusStore, 'focusState')
		this.registerStore(MediaStore, 'mediaState')

		this.onVisibilityChange = this.onVisibilityChange.bind(this)
		this.onMouseDown = this.onMouseDown.bind(this)
		this.onFocus = this.onFocus.bind(this)
		this.startObservingForIntersectionChanges = this.startObservingForIntersectionChanges.bind(this)
		this.stopObservingForIntersectionChanges = this.stopObservingForIntersectionChanges.bind(this)
		this.onIntersectionChange = this.onIntersectionChange.bind(this)
		this.onResize = this.onResize.bind(this)
		this.unlockNavigation = this.unlockNavigation.bind(this)
		this.clearPreviewScores = this.clearPreviewScores.bind(this)
		this.onDelayResize = this.onDelayResize.bind(this)
		this.clearSelectionIfNavTargetChanging = this.clearSelectionIfNavTargetChanging.bind(this)
	}

	componentDidMount() {
		document.addEventListener('visibilitychange', this.onVisibilityChange)

		let visitIdFromApi
		let extensions
		let viewState
		let isPreviewing
		let outcomeServiceURL = 'the external system'
		let viewSessionId

		Dispatcher.trigger('viewer:loading')

		ViewerAPI.requestStart(this.props.visitId, this.props.draftId)
			.then(visit => {
				QuestionStore.init()
				ModalStore.init()
				FocusStore.init()
				MediaStore.init()

				if (visit.status !== 'ok') throw 'Invalid Visit Id'

				visitIdFromApi = visit.value.visitId
				viewState = visit.value.viewState
				extensions = visit.value.extensions
				isPreviewing = visit.value.isPreviewing
				outcomeServiceURL = visit.value.lti.lisOutcomeServiceUrl

				return ViewerAPI.getDraft(this.props.draftId)
			})
			.then(injectKatexIfNeeded)
			.then(draftModel => {
				const model = OboModel.create(draftModel)

				// assessment store must initialize before NavStore goes to the first page
				AssessmentStore.init(extensions)

				NavStore.init(
					this.props.draftId,
					model,
					model.modelState.start,
					window.location.pathname,
					visitIdFromApi,
					viewState
				)

				enableWindowCloseDispatcher()

				window.onresize = this.onResize

				Dispatcher.on('nav:open', this.onDelayResize)
				Dispatcher.on('nav:close', this.onDelayResize)
				Dispatcher.on('nav:toggle', this.onDelayResize)

				this.setState(
					{
						model,
						navState: NavStore.getState(),
						mediaState: MediaStore.getState(),
						questionState: QuestionStore.getState(),
						assessmentState: AssessmentStore.getState(),
						modalState: ModalStore.getState(),
						focusState: FocusStore.getState(),
						lti: Object.assign(this.state.lti, {
							outcomeServiceHostname: getLTIOutcomeServiceHostname(outcomeServiceURL)
						}),
						loading: false,
						requestStatus: 'ok',
						isPreviewing,
						viewSessionId
					},
					() => {
						Dispatcher.trigger('viewer:loaded', true)
						if (!document.hidden) this.sendInitialViewEvent()
					}
				)
			})
			.catch(err => {
				console.error(err) /* eslint-disable-line no-console */
				this.setState({ loading: false, requestStatus: 'invalid' }, () =>
					Dispatcher.trigger('viewer:loaded', false)
				)
			})
	}

	componentWillUnmount() {
		this.unRegisterStores()
		document.removeEventListener('visibilitychange', this.onVisibilityChange)

		// Removing the intersection observer.
		this.stopObservingForIntersectionChanges()
	}

	shouldComponentUpdate(nextProps, nextState) {
		return !nextState.loading
	}

	registerStore(store, stateName) {
		const storePair = {
			store,
			listener: () => this.setState({ [stateName]: store.getState() })
		}
		this.stores[stateName] = storePair
		store.onChange(this.stores[stateName].listener)
	}

	unRegisterStores() {
		for (const stateName in this.stores) {
			const { store, listener } = this.stores[stateName]
			store.offChange(listener)
			delete this.stores[stateName]
		}
	}

	isDOMFocusInsideNav() {
		if (!this.navRef.current) {
			return false
		}
		/* eslint-disable-next-line */
		return ReactDOM.findDOMNode(this.navRef.current).contains(document.activeElement)
	}

	isNavTargetChanging(prevState) {
		return NavUtil.getNavTarget(prevState.navState) !== NavUtil.getNavTarget(this.state.navState)
	}

	scrollToTopIfNavTargetChanging(prevState) {
		if (this.isNavTargetChanging(prevState)) {
			this.scrollToTop()
		}
	}

	clearSelectionIfNavTargetChanging(prevState) {
		if (!this.isNavTargetChanging(prevState)) {
			return
		}

		const selection = window.getSelection()

		if (selection.removeAllRanges) {
			selection.removeAllRanges()
		} else if (selection.empty) {
			selection.empty()
		}
	}

	focusOnContentIfNavTargetChanging(prevState) {
		const focussedItem = FocusUtil.getFocussedItem(this.state.focusState)

		if (
			!this.isDOMFocusInsideNav() &&
			this.isNavTargetChanging(prevState) &&
			focussedItem.type === null
		) {
			FocusUtil.focusOnNavTarget()
		}
	}

	componentDidUpdate(prevProps, prevState) {
		// remove loading element
		if (prevState.loading && !this.state.loading) {
			const loadingEl = document.getElementById('app-loading')
			if (loadingEl && loadingEl.parentElement) {
				document.getElementById('viewer-app').classList.add('is-loaded')
				loadingEl.parentElement.removeChild(loadingEl)
				this.scrollToTop()
			}
		}

		if (this.state.requestStatus === 'invalid') return

		this.focusOnContentIfNavTargetChanging(prevState)
		this.scrollToTopIfNavTargetChanging(prevState)
		this.clearSelectionIfNavTargetChanging(prevState)

		// use Focus Store values to update DOM Focus
		this.updateDOMFocus()
		this.startObservingForIntersectionChanges()
	}

	updateDOMFocus() {
		const focussedItem = FocusUtil.getFocussedItemAndClear(this.state.focusState)

		switch (focussedItem.type) {
			case FocusStore.TYPE_COMPONENT: {
				return this.focusComponent(OboModel.models[focussedItem.target], focussedItem.options)
			}

			case FocusStore.TYPE_NAV_TARGET: {
				return this.focusComponent(
					NavUtil.getNavTargetModel(this.state.navState),
					focussedItem.options
				)
			}

			case FocusStore.TYPE_VIEWER: {
				return this.focusViewer(focussedItem.target)
			}
		}

		return false
	}

	focusViewer(viewerFocusTarget) {
		switch (viewerFocusTarget) {
			case FocusStore.VIEWER_TARGET_NAVIGATION: {
				if (!NavUtil.isNavEnabled(this.state.navState) || !NavUtil.isNavOpen(this.state.navState)) {
					return false
				}

				this.navRef.current.focus()

				return true
			}
		}

		return false
	}

	focusComponent(model, opts) {
		if (!model) return false

		// Save the current scroll location since focus() will scroll the page (there is a
		// preventScroll option but it is not widely supported). Once focus is called we'll
		// quickly reset the scroll location to what it was before the focus. This allows
		// the smooth scroll to move from where the page was rather than scrolling from an
		// unexpected location.
		const currentScrollTop = this.containerRef.current.scrollTop
		const el = model.getDomEl()

		const Component = model.getComponentClass ? model.getComponentClass() : null

		if (Component && Component.focusOnContent) {
			Component.focusOnContent(model, opts)
		} else {
			focus(el, opts.preventScroll)
		}

		if (opts.animateScroll) {
			this.containerRef.current.scrollTop = currentScrollTop
			el.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}

		return true
	}

	onVisibilityChange() {
		// From Viewing to Hiding
		if (document.hidden) {
			this.viewerHideDate = new Date()

			ViewerAPI.postEvent({
				draftId: this.state.model.get('draftId'),
				action: 'viewer:leave',
				eventVersion: '1.0.0',
				visitId: this.state.navState.visitId
			}).then(res => {
				this.leaveEvent = res.value
			})

			return
		}

		// From Hiding to Viewing
		if (this.viewerHideDate) {
			// leaveEvent may not exist if postEvent for 'viewer:leave' didn't complete
			const relatedEventId = this.leaveEvent?.extensions?.internalEventId ?? 'not available'

			ViewerAPI.postEvent({
				draftId: this.state.model.get('draftId'),
				action: 'viewer:return',
				eventVersion: '3.0.0',
				visitId: this.state.navState.visitId,
				payload: {
					relatedEventId,
					leftTime: this.viewerHideDate,
					duration: Date.now() - this.viewerHideDate
				}
			})

			delete this.leaveEvent
			delete this.viewerHideDate

			return
		}

		// Opened in Background and Viewed for the first time
		// When this happens, document.hidden is true when the page loads, so onVisibilityChange
		// isn't called. When the user views the tab document.hidden will become false, but
		// this.viewerHideDate will not be set so we get to this point - in which case we fire
		// the initialView event:
		this.sendInitialViewEvent()
	}

	// first view Event
	sendInitialViewEvent() {
		ViewerAPI.postEvent({
			draftId: this.state.model.get('draftId'),
			action: 'viewer:initialView',
			eventVersion: '1.0.0',
			visitId: this.state.navState.visitId
		})
	}

	getTextForVariable(event, variable, textModel) {
		return (event.text = Common.Registry.getTextForVariable(variable, textModel, this.state))
	}

	scrollToTop(animateScroll = false) {
		if (!this.state.model || !this.state.model.getDomEl || !this.state.model.getDomEl()) {
			return false
		}

		if (animateScroll) {
			this.state.model.getDomEl().scrollIntoView({ behavior: 'smooth', block: 'start' })
		} else {
			this.state.model.getDomEl().scrollIntoView()
		}

		return true
	}

	// === NON REACT LIFECYCLE METHODS ===

	onMouseDown(event) {
		this.clearFadeEffect(event.target)
	}

	onFocus(event) {
		this.clearFadeEffect(event.target)
	}

	clearFadeEffect(el) {
		// When focusing on another element we want to remove
		// the focus effect if the element is not part of the focused element

		const visuallyFocussedModel = FocusUtil.getVisuallyFocussedModel(this.state.focusState)

		if (visuallyFocussedModel) {
			const focussedElement = visuallyFocussedModel.getDomEl()

			if (!focussedElement || !focussedElement.contains(el)) {
				FocusUtil.clearFadeEffect()
			}
		}
	}

	startObservingForIntersectionChanges() {
		this.stopObservingForIntersectionChanges()
		const focusState = this.state.focusState

		// Only creates an Intersection Observer object when the 'visualFocusTarget'
		// property of 'focusState' is set - this is when all of the elements of the
		// page are faded except for the visualFocusTarget (for example, when answering
		// a practice question)
		if (!focusState.visualFocusTarget) {
			return
		}

		const component = FocusUtil.getVisuallyFocussedModel(focusState)
		if (!component) {
			return
		}

		const el = component.getDomEl()
		if (!el) {
			return
		}

		// If an intersection observer is created below, we're 100% sure that
		// 'focusState.visualFocusTarget' is set.
		this.observer = new IntersectionObserver(this.onIntersectionChange, {
			root: null,
			rootMargin: '0px',
			threshold: 0
		})

		this.observer.observe(el)
	}

	stopObservingForIntersectionChanges() {
		if (!this.observer) return false

		this.observer.disconnect()
		delete this.observer

		return true
	}

	onIntersectionChange(changes) {
		const change = changes[0]

		if (change.intersectionRatio > 0) {
			return false
		}

		FocusUtil.clearFadeEffect()
		this.stopObservingForIntersectionChanges()
		return true
	}

	onResize() {
		Dispatcher.trigger(
			'viewer:contentAreaResized',
			/* eslint-disable-next-line */
			ReactDOM.findDOMNode(this.containerRef.current).getBoundingClientRect().width
		)
	}

	onDelayResize() {
		window.setTimeout(this.onResize, NAV_CLOSE_DURATION_MS)
	}

	onIdle(event) {
		return ViewerAPI.postEvent({
			draftId: this.state.model.get('draftId'),
			action: 'viewer:inactive',
			eventVersion: '3.0.0',
			visitId: this.state.navState.visitId,
			payload: {
				lastActiveTime: event.lastActiveEpoch,
				inactiveDuration: IDLE_TIMEOUT_DURATION_MS
			}
		}).then(result => {
			this.inactiveEvent = result.response.value
		})
	}

	onReturnFromIdle(event) {
		const inactiveEvent = this.inactiveEvent

		delete this.inactiveEvent

		return ViewerAPI.postEvent({
			draftId: this.state.model.get('draftId'),
			action: 'viewer:returnFromInactive',
			eventVersion: '2.1.0',
			visitId: this.state.navState.visitId,
			payload: {
				lastActiveTime: event.lastActiveEpoch,
				inactiveDuration: event.inactiveDuration,
				relatedEventId: inactiveEvent.extensions.internalEventId
			}
		})
	}

	sendCloseEvent() {
		ViewerAPI.postEventBeacon({
			draftId: this.state.model.get('draftId'),
			action: 'viewer:close',
			eventVersion: '1.0.0',
			visitId: this.state.navState.visitId
		})
	}

	clearPreviewScores() {
		ViewerAPI.clearPreviewScores({
			draftId: this.state.model.get('draftId'),
			visitId: this.state.navState.visitId
		}).then(res => {
			if (res.status === 'error' || res.error) {
				return ModalUtil.show(
					<SimpleDialog ok width="15em">
						{res.value && res.value.message
							? `There was an error resetting assessments and questions: ${res.value.message}.`
							: 'There was an error resetting assessments and questions'}
					</SimpleDialog>
				)
			}

			AssessmentStore.init()
			QuestionStore.init()

			AssessmentStore.triggerChange()
			QuestionStore.triggerChange()

			ModalUtil.show(
				<SimpleDialog
					ok
					width="19em"
					modalClassName="assessment-reset-simple-dialog"
					hideCloseButton={true}
				>
					Assessment attempts and all question responses have been reset.
				</SimpleDialog>
			)
		})
	}

	unlockNavigation() {
		return NavUtil.unlock()
	}

	renderRequestStatusError() {
		const serviceName = this.state.lti.outcomeServiceHostname
			? this.state.lti.outcomeServiceHostname
			: 'the external system'

		return (
			<div className="viewer--viewer-app--visit-error">
				There was a problem starting your visit. Please return to {serviceName} and relaunch this
				module.
			</div>
		)
	}

	buildPageNavProps() {
		const canNavigate = NavUtil.canNavigate(this.state.navState)
		const prevItem = NavUtil.getPrev(this.state.navState)
		const nextItem = NavUtil.getNext(this.state.navState)

		let prevProps
		let nextProps

		if (prevItem) {
			prevProps = {
				title: prevItem.label ? 'Back: ' + prevItem.label : 'Back',
				ariaLabel: prevItem.label ? 'Go back to ' + prevItem.label : 'Go back',
				disabled: !canNavigate
			}
		} else {
			prevProps = {
				title: `Start of ${this.state.model.title}`,
				ariaLabel: `This is the start of ${this.state.model.title}.`,
				disabled: true
			}
		}

		if (nextItem) {
			nextProps = {
				title: nextItem.label ? 'Next: ' + nextItem.label : 'Next',
				ariaLabel: nextItem.label ? 'Go forward to ' + nextItem.label : 'Go forward',
				disabled: !canNavigate
			}
		} else {
			nextProps = {
				title: `End of ${this.state.model.title}`,
				ariaLabel: `You have reached the end of ${this.state.model.title}.`,
				disabled: true
			}
		}

		return {
			prevProps,
			nextProps
		}
	}

	renderViewer() {
		NavUtil.isNavEnabled(this.state.navState)
		const { prevProps, nextProps } = this.buildPageNavProps()
		const ModuleComponent = this.state.model.getComponentClass()
		const navTargetItem = NavUtil.getNavTarget(this.state.navState)
		let navTargetLabel = ''
		if (navTargetItem && navTargetItem.label) {
			navTargetLabel = navTargetItem.label
		}

		return (
			<React.Fragment>
				<Header moduleTitle={this.state.model.title} location={navTargetLabel} />
				<Nav
					ref={this.navRef}
					navState={this.state.navState}
					assessmentState={this.state.assessmentState}
				/>
				<InlineNavButton type="prev" {...prevProps} />
				<ModuleComponent model={this.state.model} moduleData={this.state} />
				<InlineNavButton type="next" {...nextProps} />
			</React.Fragment>
		)
	}

	getViewerClassNames() {
		const s = this.state
		const visuallyFocussedModel = FocusUtil.getVisuallyFocussedModel(s.focusState)

		return (
			isOrNot(s.isPreviewing, 'previewing') +
			isOrNot(s.navState.open, 'open-nav') +
			isOrNot(s.navState.disabled, 'disabled-nav') +
			isOrNot(visuallyFocussedModel, 'focus-state-active')
		)
	}

	render() {
		if (this.state.loading) return null

		if (this.state.requestStatus === 'invalid') {
			return this.renderRequestStatusError()
		}

		const modalItem = ModalUtil.getCurrentModal(this.state.modalState)
		const hideViewer = modalItem && modalItem.hideViewer

		return (
			<div
				ref={this.containerRef}
				onMouseDown={this.onMouseDown}
				onFocus={this.onFocus}
				className={'viewer--viewer-app' + this.getViewerClassNames()}
			>
				<ObojoboIdleTimer timeout={IDLE_TIMEOUT_DURATION_MS} />

				{hideViewer ? null : this.renderViewer()}

				{this.state.isPreviewing ? (
					<div className="preview-banner">
						<span>Preview mode</span>
						<div className="controls">
							<span>Preview options:</span>
							<button onClick={this.unlockNavigation} disabled={!this.state.navState.locked}>
								Unlock navigation
							</button>
							<button onClick={this.clearPreviewScores}>Reset assessments &amp; questions</button>
						</div>
						<div className="border" />
					</div>
				) : null}

				<FocusBlocker moduleData={this.state} />
				<ModalContainer modalItem={modalItem} />
			</div>
		)
	}
}
