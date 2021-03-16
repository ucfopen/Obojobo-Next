const { handle } = require('redux-pack')

const whitespaceRegex = /\s+/g

const {
	SHOW_MODULE_PERMISSIONS,
	CLOSE_MODAL,
	LOAD_USER_SEARCH,
	LOAD_USERS_FOR_MODULE,
	ADD_USER_TO_MODULE,
	CLEAR_PEOPLE_SEARCH_RESULTS,
	DELETE_MODULE_PERMISSIONS,
	DELETE_MODULE,
	CREATE_NEW_MODULE,
	FILTER_MODULES,
	FILTER_COLLECTIONS,
	SHOW_MODULE_MORE,
	CREATE_NEW_COLLECTION,
	SHOW_MODULE_MANAGE_COLLECTIONS,
	LOAD_MODULE_COLLECTIONS,
	MODULE_ADD_TO_COLLECTION,
	MODULE_REMOVE_FROM_COLLECTION,
	SHOW_COLLECTION_MANAGE_MODULES,
	LOAD_COLLECTION_MODULES,
	COLLECTION_ADD_MODULE,
	COLLECTION_REMOVE_MODULE,
	LOAD_MODULE_SEARCH,
	CLEAR_MODULE_SEARCH_RESULTS,
	SHOW_COLLECTION_RENAME,
	RENAME_COLLECTION,
	DELETE_COLLECTION,
	SHOW_VERSION_HISTORY,
	RESTORE_VERSION
} = require('../actions/dashboard-actions')

const searchPeopleResultsState = (isFetching = false, hasFetched = false, items = []) => ({
	items,
	hasFetched,
	isFetching
})

const searchModuleResultsState = (isFetching = false, hasFetched = false, items = []) => ({
	items,
	hasFetched,
	isFetching
})

const closedDialogState = () => ({
	dialog: null,
	dialogProps: null,
	versionHistory: {
		isFetching: false,
		hasFetched: false,
		items: []
	}
})

function filterModules(modules, searchString) {
	searchString = ('' + searchString).replace(whitespaceRegex, '').toLowerCase()

	return modules.filter(m =>
		((m.title || '') + m.draftId)
			.replace(whitespaceRegex, '')
			.toLowerCase()
			.includes(searchString)
	)
}
function filterCollections(collections, searchString) {
	searchString = ('' + searchString).replace(whitespaceRegex, '').toLowerCase()

	return collections.filter(c =>
		((c.title || '') + c.id)
			.replace(whitespaceRegex, '')
			.toLowerCase()
			.includes(searchString)
	)
}

function DashboardReducer(state, action) {
	switch (action.type) {
		case CREATE_NEW_COLLECTION:
		case DELETE_COLLECTION:
			return handle(state, action, {
				success: prevState => {
					const filteredCollections = filterCollections(
						action.payload.value,
						state.collectionSearchString
					)
					return {
						...prevState,
						collectionSearchString: '',
						myCollections: action.payload.value,
						filteredCollections
					}
				}
			})
		case RENAME_COLLECTION:
			return handle(state, action, {
				success: prevState => {
					const newState = { ...prevState }
					newState.myCollections = action.payload.value
					newState.filteredCollections = filterCollections(
						action.payload.value,
						state.collectionSearchString
					)
					if (
						action.meta.currentCollectionId &&
						action.meta.changedCollectionId === action.meta.currentCollectionId
					) {
						newState.collection.title = action.meta.changedCollectionTitle
					}
					return newState
				}
			})

		case CREATE_NEW_MODULE:
			return handle(state, action, {
				// update my modules list & remove filtering because the new module could be filtered
				success: prevState => ({
					...prevState,
					moduleCount: action.payload.value.allCount,
					myModules: action.payload.value.modules,
					moduleSearchString: '',
					filteredModules: null
				})
			})

		case DELETE_MODULE:
			return handle(state, action, {
				// close the dialog containing the delete button
				start: () => ({ ...state, ...closedDialogState() }),
				// update myModules and re-apply the filter if one exists
				success: prevState => {
					const filteredModules = filterModules(action.payload.value.modules, state.moduleSearchString)
					return {
						...prevState,
						moduleCount: action.payload.value.allCount,
						myModules: action.payload.value.modules,
						filteredModules
					}
				}
			})

		case SHOW_MODULE_MORE:
			return {
				...state,
				dialog: 'module-more',
				selectedModule: action.module
			}

		case SHOW_MODULE_PERMISSIONS:
			return {
				...state,
				dialog: 'module-permissions',
				selectedModule: action.module,
				searchPeople: searchPeopleResultsState()
			}

		case CLOSE_MODAL:
			return {
				...state,
				...closedDialogState()
			}

		case FILTER_MODULES:
			return {
				...state,
				filteredModules: filterModules(state.myModules, action.searchString),
				moduleSearchString: action.searchString
			}
		case FILTER_COLLECTIONS:
			return {
				...state,
				filteredCollections: filterCollections(state.myCollections, action.searchString),
				collectionSearchString: action.searchString
			}

		case CLEAR_PEOPLE_SEARCH_RESULTS:
			return { ...state, searchPeople: searchPeopleResultsState(), shareSearchString: '' }

		case DELETE_MODULE_PERMISSIONS:
		case LOAD_USERS_FOR_MODULE:
		case ADD_USER_TO_MODULE:
			return handle(state, action, {
				// update the permissions and re-populate the search state
				start: prevState => {
					const searchPeople = searchPeopleResultsState(true)
					const newState = { ...prevState }
					newState.draftPermissions = { ...newState.draftPermissions }
					newState.draftPermissions[newState.selectedModule.draftId] = searchPeople
					return newState
				},
				// update the permissions and repopulate search state
				// update the modules if the payload contains them
				success: prevState => {
					const searchPeople = searchPeopleResultsState(false, true, action.payload.value)
					const newState = { ...prevState }
					newState.draftPermissions = { ...newState.draftPermissions }
					newState.draftPermissions[newState.selectedModule.draftId] = searchPeople
					if (action.payload.modules) {
						newState.moduleCount = action.payload.modules.allCount
						newState.myModules = action.payload.modules.modules
					}
					return newState
				}
			})

		case LOAD_MODULE_COLLECTIONS:
		case MODULE_ADD_TO_COLLECTION:
		case MODULE_REMOVE_FROM_COLLECTION:
			return handle(state, action, {
				success: prevState => {
					const newState = { ...prevState }
					newState.draftCollections = action.payload.value
					return newState
				}
			})

		case LOAD_USER_SEARCH:
			return handle(state, action, {
				start: prevState => ({ ...prevState, shareSearchString: action.meta.searchString }),
				success: prevState => ({ ...prevState, searchPeople: { items: action.payload.value } })
			})

		case SHOW_MODULE_MANAGE_COLLECTIONS:
			return {
				...state,
				dialog: 'module-manage-collections',
				selectedModule: action.module
			}

		case SHOW_COLLECTION_MANAGE_MODULES:
			return {
				...state,
				dialog: 'collection-manage-modules',
				selectedCollection: action.collection,
				searchModules: searchModuleResultsState()
			}

		case LOAD_MODULE_SEARCH:
			return handle(state, action, {
				start: prevState => ({
					...prevState,
					collectionModuleSearchString: action.meta.searchString
				}),
				success: prevState => ({
					...prevState,
					searchModules: {
						items: action.payload.value.modules
					}
				})
			})

		case CLEAR_MODULE_SEARCH_RESULTS:
			return { ...state, searchModules: searchModuleResultsState(), shareSearchString: '' }

		case COLLECTION_ADD_MODULE:
		case COLLECTION_REMOVE_MODULE:
		case LOAD_COLLECTION_MODULES:
			return handle(state, action, {
				success: prevState => {
					const newState = { ...prevState }
					newState.collectionModules = action.payload.value.modules
					if (
						action.meta.currentCollectionId &&
						action.meta.changedCollectionId === action.meta.currentCollectionId
					) {
						newState.myModules = action.payload.value.modules
					}
					return newState
				}
			})

		case SHOW_COLLECTION_RENAME:
			return {
				...state,
				dialog: 'collection-rename',
				selectedCollection: action.collection
			}

		case SHOW_VERSION_HISTORY:
			return handle(state, action, {
				start: prevState => ({
					...prevState,
					dialog: 'module-version-history',
					selectedModule: action.meta.module,
					versionHistory: {
						isFetching: true,
						hasFetched: false,
						items: []
					}
				}),
				success: prevState => ({
					...prevState,
					versionHistory: {
						isFetching: false,
						hasFetched: true,
						items: action.payload
					}
				})
			})

		case RESTORE_VERSION:
			return handle(state, action, {
				start: prevState => ({
					...prevState,
					versionHistory: {
						isFetching: true,
						hasFetched: false,
						items: []
					}
				}),
				success: prevState => ({
					...prevState,
					versionHistory: {
						isFetching: false,
						hasFetched: true,
						items: action.payload
					}
				})
			})

		default:
			return state
	}
}

module.exports = DashboardReducer
