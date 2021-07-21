import Common from 'Common'

const { Dispatcher } = Common.flux
const { OboModel } = Common.models

const getFlatList = function(item) {
	let list = []
	const model = OboModel.models[item.id]
	if (model && model.get('type') === 'ObojoboDraft.Sections.Assessment') {
		item.flags.assessment = true
	}
	if (item.type !== 'hidden') {
		list.push(item)
	}

	if (item.showChildren) {
		for (const child of Array.from(item.children)) {
			list = list.concat(getFlatList(child))
		}
	}

	return list
}

const NavUtil = {
	rebuildMenu(model) {
		return Dispatcher.trigger('nav:rebuildMenu', {
			value: {
				model
			}
		})
	},

	gotoPath(path) {
		return Dispatcher.trigger('nav:gotoPath', {
			value: {
				path
			}
		})
	},

	// gotoCurrentPathname: () ->
	// 	window.location.pathname

	setFlag(id, flagName, flagValue) {
		return Dispatcher.trigger('nav:setFlag', {
			value: {
				id,
				flagName,
				flagValue
			}
		})
	},

	goPrev() {
		return Dispatcher.trigger('nav:prev')
	},

	goNext() {
		return Dispatcher.trigger('nav:next')
	},

	goto(id) {
		return Dispatcher.trigger('nav:goto', {
			value: {
				id
			}
		})
	},

	lock() {
		return Dispatcher.trigger('nav:lock')
	},

	unlock() {
		return Dispatcher.trigger('nav:unlock')
	},

	close() {
		return Dispatcher.trigger('nav:close')
	},

	open() {
		return Dispatcher.trigger('nav:open')
	},

	toggle() {
		return Dispatcher.trigger('nav:toggle')
	},

	openExternalLink(url) {
		return Dispatcher.trigger('nav:openExternalLink', {
			value: {
				url
			}
		})
	},

	showChildren(id) {
		return Dispatcher.trigger('nav:showChildren', {
			value: {
				id
			}
		})
	},

	hideChildren(id) {
		return Dispatcher.trigger('nav:hideChildren', {
			value: {
				id
			}
		})
	},

	getNavTarget(state) {
		if (!state || !state.itemsById) return null
		return state.itemsById[state.navTargetId] || null
	},

	getNavTargetModel(state) {
		const navTarget = NavUtil.getNavTarget(state)
		if (!navTarget) {
			return null
		}

		return OboModel.models[navTarget.id] || null
	},

	getFirst(state) {
		const list = NavUtil.getOrderedList(state)

		for (const item of Array.from(list)) {
			if (item.type === 'link') {
				return item
			}
		}

		return null
	},

	getPrev(state) {
		// state.items[NavUtil.getPrevIndex(state)]
		const list = NavUtil.getOrderedList(state)
		const navTarget = NavUtil.getNavTarget(state)
		let index = list.indexOf(navTarget)

		if (index === -1) {
			return null
		}

		index--
		while (index >= 0) {
			const item = list[index]
			if (item.type === 'link') {
				return item
			}

			index--
		}

		return null
	},

	getNext(state) {
		// state.items[NavUtil.getPrevIndex(state)]
		const list = NavUtil.getOrderedList(state)
		const navTarget = NavUtil.getNavTarget(state)
		let index = list.indexOf(navTarget)

		if (index === -1) {
			return null
		}

		index++
		const len = list.length
		while (index < len) {
			const item = list[index]
			if (item.type === 'link') {
				return item
			}

			index++
		}

		return null
	},

	getPrevModel(state) {
		const prevItem = NavUtil.getPrev(state)
		if (!prevItem) {
			return null
		}

		return OboModel.models[prevItem.id]
	},

	getNextModel(state) {
		const nextItem = NavUtil.getNext(state)
		if (!nextItem) {
			return null
		}

		return OboModel.models[nextItem.id]
	},

	getNavItemForModel(state, model) {
		const item = state.itemsById[model.get('id')]
		if (!item) {
			return null
		}

		return item
	},

	getNavLabelForModel(state, model) {
		const item = NavUtil.getNavItemForModel(state, model)
		if (!item) {
			return null
		}

		return item.label
	},

	canNavigate(state) {
		return !state.locked
	},

	getOrderedList(state) {
		return getFlatList(state.items)
	},

	getContext(state) {
		return state.context
	},

	setContext(context) {
		return Dispatcher.trigger('nav:setContext', {
			value: {
				context
			}
		})
	},

	resetContext() {
		return Dispatcher.trigger('nav:resetContext')
	},

	isNavEnabled(state) {
		return !state.disabled
	},

	isNavOpen(state) {
		return state.open
	},

	setRedAlert(redAlert) {
		return Dispatcher.trigger('nav:setRedAlert', {
			value: {
				redAlert
			}
		})
	},

	isRedAlertEnabled(state) {
		return state.redAlert
	}
}

export default NavUtil
