import Common from 'Common'
import NavUtil from '../../viewer/util/nav-util'
import ViewerAPI from '../../viewer/util/viewer-api'
import FocusUtil from '../../viewer/util/focus-util'
import { startHeartBeat } from '../../viewer/util/stop-viewer'

const { Store } = Common.flux
const { Dispatcher } = Common.flux
const { debounce } = Common.util

const DEFAULT_CONTEXT = 'practice'

class NavStore extends Store {
	constructor() {
		let item
		let oldNavTargetId
		super('navstore')

		this.pendingPath = null

		this.state = {
			isInitialized: false,
			items: {},
			itemsById: {},
			itemsByPath: {},
			itemsByFullPath: {},
			navTargetHistory: [],
			navTargetId: null,
			locked: false,
			open: false,
			context: DEFAULT_CONTEXT,
			visitId: null,
			draftId: null
		}

		// create a debounced state change function
		// to handle multiple simultaneous events
		// that occur like when someone clicks outside
		// the nav (causing a close) ON a nav toggle button
		this.updateOpenState = debounce(1, newOpen => {
			if (newOpen === this.state.open) return

			const action = newOpen ? 'nav:open' : 'nav:close'
			ViewerAPI.postEvent({
				draftId: this.state.draftId,
				action: action,
				eventVersion: '1.0.0',
				visitId: this.state.visitId
			})
			this.setAndTrigger({ open: newOpen })
		})

		Dispatcher.on(
			{
				'nav:setContext': payload => {
					this.state.context = payload.value.context
					return this.triggerChange()
				},
				'nav:resetContext': () => {
					this.state.context = DEFAULT_CONTEXT
					return this.triggerChange()
				},
				'nav:rebuildMenu': payload => {
					this.buildMenu(payload.value.model)
					this.triggerChange()
				},
				'nav:gotoPath': payload => {
					if (!this.state.isInitialized) {
						this.pendingTarget = {
							type: 'path',
							target: payload.value.path
						}

						return
					}

					oldNavTargetId = this.state.navTargetId
					if (this.gotoItem(this.state.itemsByPath[payload.value.path])) {
						ViewerAPI.postEvent({
							draftId: this.state.draftId,
							action: 'nav:gotoPath',
							eventVersion: '1.0.0',
							visitId: this.state.visitId,
							payload: {
								from: oldNavTargetId,
								to: this.state.itemsByPath[payload.value.path].id
							}
						})
					}
				},
				'nav:setFlag': payload => {
					const navItem = this.state.itemsById[payload.value.id]
					navItem.flags[payload.value.flagName] = payload.value.flagValue
					this.triggerChange()
				},
				'nav:prev': () => {
					oldNavTargetId = this.state.navTargetId
					const prev = NavUtil.getPrev(this.state)
					if (this.gotoItem(prev)) {
						ViewerAPI.postEvent({
							draftId: this.state.draftId,
							action: 'nav:prev',
							eventVersion: '1.0.0',
							visitId: this.state.visitId,
							payload: {
								from: oldNavTargetId,
								to: prev.id
							}
						})
					}
				},
				'nav:next': () => {
					oldNavTargetId = this.state.navTargetId
					const next = NavUtil.getNext(this.state)
					if (this.gotoItem(next)) {
						ViewerAPI.postEvent({
							draftId: this.state.draftId,
							action: 'nav:next',
							eventVersion: '1.0.0',
							visitId: this.state.visitId,
							payload: {
								from: oldNavTargetId,
								to: next.id
							}
						})
					}
				},
				'nav:goto': payload => {
					if (!this.state.isInitialized) {
						this.pendingTarget = {
							type: 'goto',
							target: payload.value.id
						}

						return
					}

					oldNavTargetId = this.state.navTargetId
					const navItem = this.state.itemsById[payload.value.id]

					if (!navItem) {
						this.gotoFirst()
					} else if (this.gotoItem(navItem)) {
						ViewerAPI.postEvent({
							draftId: this.state.draftId,
							action: 'nav:goto',
							eventVersion: '1.0.0',
							visitId: this.state.visitId,
							payload: {
								from: oldNavTargetId,
								to: this.state.itemsById[payload.value.id].id
							}
						})
					}
				},
				'nav:lock': () => {
					ViewerAPI.postEvent({
						draftId: this.state.draftId,
						action: 'nav:lock',
						eventVersion: '1.0.0',
						visitId: this.state.visitId
					})
					this.setAndTrigger({ locked: true })
				},
				'nav:unlock': () => {
					ViewerAPI.postEvent({
						draftId: this.state.draftId,
						action: 'nav:unlock',
						eventVersion: '1.0.0',
						visitId: this.state.visitId
					})
					this.setAndTrigger({ locked: false })
				},
				'nav:close': () => {
					this.updateOpenState(false)
				},
				'nav:open': () => {
					this.updateOpenState(true)
				},
				'nav:toggle': () => {
					this.updateOpenState(!this.state.open)
				},
				'nav:openExternalLink': payload => {
					window.open(payload.value.url)
					this.triggerChange()
				},
				'nav:showChildren': payload => {
					item = this.state.itemsById[payload.value.id]
					item.showChildren = true
					this.triggerChange()
				},
				'nav:hideChildren': payload => {
					item = this.state.itemsById[payload.value.id]
					item.showChildren = false
					this.triggerChange()
				},
				'question:scoreSet': payload => {
					const navItem = this.state.itemsById[payload.value.id]
					if (navItem) {
						NavUtil.setFlag(payload.value.id, 'correct', payload.value.score === 100)
					}
				},
				'nav:setRedAlert': payload => {
					APIUtil.postEvent({
						draftId: this.state.draftId,
						action: 'nav:setRedAlert',
						eventVersion: '1.0.0',
						visitId: this.state.visitId,
						payload: {
							from: this.state.redAlert,
							to: payload.value.redAlert
						}
					})
					this.state.redAlert = payload.value.redAlert
					return this.triggerChange()
				}
			},
			this
		)
	}

	init(
		draftId,
		model,
		startingId,
		startingPath,
		visitId,
		viewState = {},
		isRedAlertEnabled = false
	) {
		this.state = {
			isInitialized: true,
			items: {},
			redAlert: isRedAlertEnabled,
			itemsById: {},
			itemsByPath: {},
			itemsByFullPath: {},
			navTargetHistory: [],
			navTargetId: null,
			locked:
				viewState['nav:isLocked'] !== null && typeof viewState['nav:isLocked'] !== 'undefined'
					? Boolean(viewState['nav:isLocked'].value)
					: false,
			open:
				viewState['nav:isOpen'] !== null && typeof viewState['nav:isOpen'] !== 'undefined'
					? Boolean(viewState['nav:isOpen'].value)
					: true,
			context: DEFAULT_CONTEXT,
			visitId,
			draftId
		}

		startHeartBeat(this.state.draftId)
		this.buildMenu(model)
		this.gotoStartingTarget(startingId, startingPath)
	}

	gotoStartingTarget(startingId, startingPath) {
		// Special case - If something in the system has navigated before we're done
		// being initialized we go there instead of honoring the 'start' nav target
		if (this.pendingTarget) {
			const { type, target } = this.pendingTarget

			this.pendingTarget = null

			switch (type) {
				case 'path':
					NavUtil.gotoPath(target)
					break

				case 'goto':
					NavUtil.goto(target)
					break
			}

			return
		}

		NavUtil.gotoPath(startingPath)

		if (startingId !== null && typeof startingId !== 'undefined') {
			NavUtil.goto(startingId)
		} else {
			this.gotoFirst()
		}
	}

	buildMenu(model) {
		this.state.itemsById = {}
		this.state.itemsByPath = {}
		this.state.itemsByFullPath = {}
		this.state.items = this.generateNav(model)
	}

	gotoFirst() {
		const first = NavUtil.getFirst(this.state)
		if (first && first.id) NavUtil.goto(first.id)
	}

	gotoItem(navItem) {
		if (!navItem) {
			return false
		}

		if (this.state.navTargetId !== null && typeof this.state.navTargetId !== 'undefined') {
			if (this.state.navTargetId === navItem.id) {
				return false
			}

			const navTargetModel = NavUtil.getNavTargetModel(this.state)
			if (navTargetModel && navTargetModel.processTrigger) {
				navTargetModel.processTrigger('onNavExit')
			}
			this.state.navTargetHistory.push(this.state.navTargetId)
			this.state.itemsById[this.state.navTargetId].showChildren = false
		}

		if (navItem.showChildrenOnNavigation) {
			navItem.showChildren = true
		}

		FocusUtil.clearFadeEffect()
		window.history.pushState({}, document.title, navItem.fullFlatPath)

		const prevNavItemId = this.state.navTargetId
		this.state.navTargetId = navItem.id
		NavUtil.getNavTargetModel(this.state).processTrigger('onNavEnter')

		Dispatcher.trigger('nav:targetChanged', {
			value: {
				from: prevNavItemId,
				to: this.state.navTargetId
			}
		})

		this.triggerChange()
		return true
	}

	generateNav(model, indent) {
		if (!model) return {}

		if (indent === null || typeof indent === 'undefined') {
			indent = ''
		}
		const item = Common.Registry.getItemForType(model.get('type'))

		let navItem = null
		if (item.getNavItem !== null && typeof item.getNavItem !== 'undefined') {
			navItem = item.getNavItem(model)
		}

		if (navItem === null || typeof navItem === 'undefined') {
			navItem = {}
		}

		navItem = Object.assign(
			{
				type: 'hidden',
				label: '',
				path: '',
				showChildren: true,
				showChildrenOnNavigation: true,
				parent: null
			},
			navItem
		)

		navItem.flags = []
		navItem.children = []
		navItem.id = model.get('id')
		navItem.fullPath = [].concat(navItem.path).filter(item => item !== '')
		navItem.flags = {
			complete: false,
			correct: false
		}

		for (const child of Array.from(model.children.models)) {
			const childNavItem = this.generateNav(child, indent + '_')
			childNavItem.parent = navItem
			navItem.children.push(childNavItem)
			childNavItem.fullPath = navItem.fullPath
				.concat(childNavItem.fullPath)
				.filter(item => item !== '')

			const flatPath = childNavItem.fullPath.join('/')
			childNavItem.flatPath = flatPath
			childNavItem.fullFlatPath = [
				'/view',
				model.getRoot().get('draftId'),
				'visit',
				this.state.visitId,
				flatPath
			].join('/')
			this.state.itemsByPath[flatPath] = childNavItem
			this.state.itemsByFullPath[childNavItem.fullFlatPath] = childNavItem
		}

		this.state.itemsById[model.get('id')] = navItem

		return navItem
	}
}

const navStore = new NavStore()
export default navStore
