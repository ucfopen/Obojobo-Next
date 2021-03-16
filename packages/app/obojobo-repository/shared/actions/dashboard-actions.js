const { MODE_RECENT, MODE_ALL, MODE_COLLECTION } = require('../repository-constants')
const debouncePromise = require('debounce-promise')
const dayjs = require('dayjs')
const advancedFormat = require('dayjs/plugin/advancedFormat')
dayjs.extend(advancedFormat)
// =================== API =======================

const JSON_MIME_TYPE = 'application/json'
const XML_MIME_TYPE = 'application/xml'
const defaultOptions = () => ({
	method: 'GET',
	credentials: 'include',
	headers: {
		Accept: JSON_MIME_TYPE,
		'Content-Type': JSON_MIME_TYPE
	}
})

const defaultModuleModeOptions = {
	mode: null
}

const throwIfNotOk = res => {
	if (!res.ok) throw Error(`Error requesting ${res.url}, status code: ${res.status}`)
	return res
}

const apiSearchForUser = searchString => {
	return fetch(`/api/users/search?q=${searchString}`, defaultOptions())
		.then(throwIfNotOk)
		.then(res => res.json())
}

const apiSearchForUserDebounced = debouncePromise(apiSearchForUser, 300)

const apiAddPermissionsToModule = (draftId, userId) => {
	const options = { ...defaultOptions(), method: 'POST', body: `{"userId":${userId}}` }
	return fetch(`/api/drafts/${draftId}/permission`, options).then(res => res.json())
}

const apiGetPermissionsForModule = draftId => {
	return fetch(`/api/drafts/${draftId}/permission`, defaultOptions()).then(res => res.json())
}

const apiGetCollectionsForModule = draftId => {
	return fetch(`/api/drafts/${draftId}/collections`, defaultOptions()).then(res => res.json())
}

const apiAddModuleToCollection = (draftId, collectionId) => {
	const options = { ...defaultOptions(), method: 'POST', body: `{"draftId":"${draftId}"}` }
	return fetch(`/api/collections/${collectionId}/module/add`, options).then(res => res.json())
}
const apiRemoveModuleFromCollection = (draftId, collectionId) => {
	const options = { ...defaultOptions(), method: 'DELETE', body: `{"draftId":"${draftId}"}` }
	return fetch(`/api/collections/${collectionId}/module/remove`, options).then(res => res.json())
}

const apiSaveDraft = async (draftId, draftJSON) => {
	if (typeof draftJSON !== 'string') draftJSON = JSON.stringify(draftJSON)
	const options = { ...defaultOptions(), method: 'POST', body: draftJSON }
	const result = await fetch(`/api/drafts/${draftId}`, options)
	const data = await result.json()
	return data
}

const apiGetVersionHistory = async draftId => {
	// limit to keep this from running away accidentally
	const emergencyLimit = 100
	const options = { ...defaultOptions() }

	// load all the history, can be multiple api calls
	let nextUrl = `/api/drafts/${draftId}/revisions`
	let count = 0
	const history = []

	while (nextUrl) {
		if (count > emergencyLimit) break
		const res = await fetch(nextUrl, options)
		nextUrl = false
		// are there more to load in the response headers?
		const linkHeader = res.headers.get('link')
		if (linkHeader) {
			const match = linkHeader.match(/<(.+?)>;\s+rel="next"/)
			nextUrl = match ? match[1] : false
		}
		const data = await res.json()
		// append to list
		history.push(...data.value)
		count++
	}

	// convert the result to what we need
	return history.map((draft, index) => ({
		createdAt: new Date(draft.createdAt),
		createdAtDisplay: dayjs(draft.createdAt).format('MMMM Do - h:mm A'),
		id: draft.revisionId,
		username: draft.userFullName,
		selected: index === 0,
		versionNumber: history.length - index
	}))
}

const apiRestoreVersion = async (draftId, versionId) => {
	const options = { ...defaultOptions() }
	// get a revision
	const res = await fetch(`/api/drafts/${draftId}/revisions/${versionId}`, options)
	const data = await res.json()
	const fullDraft = data.value.json
	// save the revision on top
	const saveResult = await apiSaveDraft(draftId, fullDraft)
	if (saveResult.status !== 'ok') throw Error('Failed restoring draft.')
	const newVersionId = saveResult.value.id
	// load history
	const history = await apiGetVersionHistory(draftId)
	// mark the restored item
	const restoredVersion = history.find(data => data.id === newVersionId)
	restoredVersion.isRestored = true
	return history
}

const apiDeletePermissionsToModule = (draftId, userId) => {
	const options = { ...defaultOptions(), method: 'DELETE' }
	return fetch(`/api/drafts/${draftId}/permission/${userId}`, options).then(res => res.json())
}

const apiDeleteModule = (draftId, collectionId) => {
	const body = JSON.stringify({ collectionId })
	const options = { ...defaultOptions(), method: 'DELETE', body }
	return fetch(`/api/drafts/${draftId}`, options).then(res => res.json())
}

const apiGetMyCollections = () => {
	return fetch('/api/collections', defaultOptions()).then(res => res.json())
}

const apiGetMyModules = () => {
	return fetch('/api/drafts', defaultOptions()).then(res => res.json())
}

const apiGetMyRecentModules = () => {
	return fetch('/api/recent/drafts', defaultOptions()).then(res => res.json())
}

const apiCreateNewCollection = () => {
	const url = '/api/collections/new'
	const options = { ...defaultOptions(), method: 'POST' }
	return fetch(url, options).then(res => res.json())
}

const apiGetModulesForCollection = collectionId => {
	return fetch(`/api/collections/${collectionId}/modules`, defaultOptions()).then(res => res.json())
}

const apiSearchForModuleNotInCollection = (searchString, collectionId) => {
	return fetch(
		`/api/collections/${collectionId}/modules/search?q=${searchString}`,
		defaultOptions()
	).then(res => res.json())
}

const apiRenameCollection = (id, title) => {
	const url = '/api/collections/rename'
	const body = JSON.stringify({ id, title })
	const options = { ...defaultOptions(), method: 'POST', body }
	return fetch(url, options).then(res => res.json())
}

const apiDeleteCollection = collection => {
	const options = { ...defaultOptions(), method: 'DELETE' }
	return fetch(`/api/collections/${collection.id}`, options).then(res => res.json())
}

const apiCreateNewModule = (useTutorial, moduleContent, collectionId = null) => {
	const url = useTutorial ? '/api/drafts/tutorial' : '/api/drafts/new'
	const body = JSON.stringify({ collectionId, moduleContent })
	const options = { ...defaultOptions(), method: 'POST', body }
	return fetch(url, options).then(res => res.json())
}

const apiGetModuleLock = async draftId => {
	const res = await fetch(`/api/locks/${draftId}`, defaultOptions())
	const data = await res.json()

	if (data.status !== 'ok') {
		throw Error(`Failed to check lock for module with id ${draftId}.`)
	}

	return data.value
}

// ================== ACTIONS ===================

const SHOW_MODULE_PERMISSIONS = 'SHOW_MODULE_PERMISSIONS'
const showModulePermissions = module => ({
	type: SHOW_MODULE_PERMISSIONS,
	module
})

const SHOW_VERSION_HISTORY = 'SHOW_VERSION_HISTORY'
const showVersionHistory = module => ({
	type: SHOW_VERSION_HISTORY,
	meta: { module },
	promise: apiGetVersionHistory(module.draftId)
})

const RESTORE_VERSION = 'RESTORE_VERSION'
const restoreVersion = (draftId, versionId) => ({
	type: RESTORE_VERSION,
	meta: {
		draftId,
		versionId
	},
	promise: apiRestoreVersion(draftId, versionId)
})

const CHECK_MODULE_LOCK = 'CHECK_MODULE_LOCK'
const checkModuleLock = draftId => ({
	type: CHECK_MODULE_LOCK,
	promise: apiGetModuleLock(draftId)
})

const CLOSE_MODAL = 'CLOSE_MODAL'
const closeModal = () => ({ type: CLOSE_MODAL })

const CLEAR_PEOPLE_SEARCH_RESULTS = 'CLEAR_PEOPLE_SEARCH_RESULTS'
const clearPeopleSearchResults = () => ({ type: CLEAR_PEOPLE_SEARCH_RESULTS })

const LOAD_USER_SEARCH = 'LOAD_USER_SEARCH'
const searchForUser = searchString => ({
	type: LOAD_USER_SEARCH,
	meta: {
		searchString
	},
	promise: apiSearchForUserDebounced(searchString)
})

const ADD_USER_TO_MODULE = 'ADD_USER_TO_MODULE'
const addUserToModule = (draftId, userId) => ({
	type: ADD_USER_TO_MODULE,
	promise: apiAddPermissionsToModule(draftId, userId).then(() =>
		apiGetPermissionsForModule(draftId)
	)
})

const DELETE_MODULE_PERMISSIONS = 'DELETE_MODULE_PERMISSIONS'
const deleteModulePermissions = (draftId, userId, options = { ...defaultModuleModeOptions }) => {
	let apiModuleGetCall

	switch (options.mode) {
		case MODE_COLLECTION:
			apiModuleGetCall = () => {
				return apiGetModulesForCollection(options.collectionId)
			}
			break
		case MODE_RECENT:
			apiModuleGetCall = apiGetMyRecentModules
			break
		case MODE_ALL:
		default:
			apiModuleGetCall = apiGetMyModules
			break
	}

	return {
		type: DELETE_MODULE_PERMISSIONS,
		promise: apiDeletePermissionsToModule(draftId, userId)
			.then(() => {
				return Promise.all([apiModuleGetCall(), apiGetPermissionsForModule(draftId)])
			})
			.then(results => ({
				value: results[1].value,
				modules: results[0].value
			}))
	}
}

const LOAD_USERS_FOR_MODULE = 'LOAD_USERS_FOR_MODULE'
const loadUsersForModule = draftId => ({
	type: LOAD_USERS_FOR_MODULE,
	promise: apiGetPermissionsForModule(draftId)
})

const DELETE_MODULE = 'DELETE_MODULE'
const deleteModule = (draftId, options = { ...defaultModuleModeOptions }) => {
	let apiModuleGetCall
	let collectionId = null

	switch (options.mode) {
		case MODE_COLLECTION:
			collectionId = options.collectionId
			apiModuleGetCall = () => {
				return apiGetModulesForCollection(options.collectionId)
			}
			break
		case MODE_RECENT:
			apiModuleGetCall = apiGetMyRecentModules
			break
		case MODE_ALL:
		default:
			apiModuleGetCall = apiGetMyModules
			break
	}

	return {
		type: DELETE_MODULE,
		promise: apiDeleteModule(draftId, collectionId).then(apiModuleGetCall)
	}
}

const CREATE_NEW_COLLECTION = 'CREATE_NEW_COLLECTION'
const createNewCollection = () => ({
	type: CREATE_NEW_COLLECTION,
	promise: apiCreateNewCollection().then(apiGetMyCollections)
})

const CREATE_NEW_MODULE = 'CREATE_NEW_MODULE'
const createNewModule = (useTutorial = false, options = { ...defaultModuleModeOptions }) => {
	let apiModuleGetCall
	let collectionId = null

	switch (options.mode) {
		case MODE_COLLECTION:
			collectionId = options.collectionId
			apiModuleGetCall = () => {
				return apiGetModulesForCollection(options.collectionId)
			}
			break
		case MODE_RECENT:
			apiModuleGetCall = apiGetMyRecentModules
			break
		case MODE_ALL:
		default:
			apiModuleGetCall = apiGetMyModules
			break
	}
	return {
		type: CREATE_NEW_MODULE,
		promise: apiCreateNewModule(useTutorial, {}, collectionId).then(apiModuleGetCall)
	}
}

const FILTER_MODULES = 'FILTER_MODULES'
const filterModules = searchString => ({
	type: FILTER_MODULES,
	searchString
})

const FILTER_COLLECTIONS = 'FILTER_COLLECTIONS'
const filterCollections = searchString => ({
	type: FILTER_COLLECTIONS,
	searchString
})

const SHOW_MODULE_MORE = 'SHOW_MODULE_MORE'
const showModuleMore = module => ({
	type: SHOW_MODULE_MORE,
	module
})

const SHOW_MODULE_MANAGE_COLLECTIONS = 'SHOW_MODULE_MANAGE_COLLECTIONS'
const showModuleManageCollections = module => ({
	type: SHOW_MODULE_MANAGE_COLLECTIONS,
	module
})

const LOAD_MODULE_COLLECTIONS = 'LOAD_MODULE_COLLECTIONS'
const loadModuleCollections = draftId => ({
	type: LOAD_MODULE_COLLECTIONS,
	promise: apiGetCollectionsForModule(draftId)
})

const MODULE_ADD_TO_COLLECTION = 'MODULE_ADD_TO_COLLECTION'
const moduleAddToCollection = (draftId, collectionId) => ({
	type: MODULE_ADD_TO_COLLECTION,
	promise: apiAddModuleToCollection(draftId, collectionId).then(() => {
		return apiGetCollectionsForModule(draftId)
	})
})

const MODULE_REMOVE_FROM_COLLECTION = 'MODULE_REMOVE_FROM_COLLECTION'
const moduleRemoveFromCollection = (draftId, collectionId) => ({
	type: MODULE_REMOVE_FROM_COLLECTION,
	promise: apiRemoveModuleFromCollection(draftId, collectionId).then(() => {
		return apiGetCollectionsForModule(draftId)
	})
})

const SHOW_COLLECTION_MANAGE_MODULES = 'SHOW_COLLECTION_MANAGE_MODULES'
const showCollectionManageModules = collection => ({
	type: SHOW_COLLECTION_MANAGE_MODULES,
	collection
})

const LOAD_COLLECTION_MODULES = 'LOAD_COLLECTION_MODULES'
const loadCollectionModules = (collectionId, options = { ...defaultModuleModeOptions }) => ({
	type: LOAD_COLLECTION_MODULES,
	meta: {
		changedCollectionId: collectionId,
		currentCollectionId: options.collectionId || null
	},
	promise: apiGetModulesForCollection(collectionId)
})

const COLLECTION_ADD_MODULE = 'COLLECTION_ADD_MODULE'
const collectionAddModule = (draftId, collectionId, options = { ...defaultModuleModeOptions }) => {
	return {
		type: COLLECTION_ADD_MODULE,
		meta: {
			changedCollectionId: collectionId,
			currentCollectionId: options.collectionId
		},
		promise: apiAddModuleToCollection(draftId, collectionId).then(() => {
			return apiGetModulesForCollection(collectionId)
		})
	}
}

const COLLECTION_REMOVE_MODULE = 'COLLECTION_REMOVE_MODULE'
const collectionRemoveModule = (
	draftId,
	collectionId,
	options = { ...defaultModuleModeOptions }
) => {
	return {
		type: COLLECTION_REMOVE_MODULE,
		meta: {
			changedCollectionId: collectionId,
			currentCollectionId: options.collectionId
		},
		promise: apiRemoveModuleFromCollection(draftId, collectionId).then(() => {
			return apiGetModulesForCollection(collectionId)
		})
	}
}

const LOAD_MODULE_SEARCH = 'LOAD_MODULE_SEARCH'
const searchForModuleNotInCollection = (searchString, collectionId) => ({
	type: LOAD_MODULE_SEARCH,
	meta: {
		searchString
	},
	promise: apiSearchForModuleNotInCollection(searchString, collectionId)
})

const CLEAR_MODULE_SEARCH_RESULTS = 'CLEAR_MODULE_SEARCH_RESULTS'
const clearModuleSearchResults = () => ({ type: CLEAR_MODULE_SEARCH_RESULTS })

const SHOW_COLLECTION_RENAME = 'SHOW_COLLECTION_RENAME'
const showCollectionRename = collection => ({
	type: SHOW_COLLECTION_RENAME,
	collection
})

const RENAME_COLLECTION = 'RENAME_COLLECTION'
const renameCollection = (collectionId, newTitle, options = { ...defaultModuleModeOptions }) => {
	return {
		type: RENAME_COLLECTION,
		meta: {
			changedCollectionTitle: newTitle,
			changedCollectionId: collectionId,
			currentCollectionId: options.collectionId
		},
		promise: apiRenameCollection(collectionId, newTitle).then(apiGetMyCollections)
	}
}

const DELETE_COLLECTION = 'DELETE_COLLECTION'
const deleteCollection = collection => ({
	type: DELETE_COLLECTION,
	promise: apiDeleteCollection(collection).then(apiGetMyCollections)
})

const IMPORT_MODULE_FILE = 'IMPORT_MODULE_FILE'
const importModuleFile = searchString => ({
	type: IMPORT_MODULE_FILE,
	promise: promptUserForModuleFileUpload(searchString)
})

const promptUserForModuleFileUpload = async () => {
	return new Promise((resolve, reject) => {
		const fileSelector = document.createElement('input')
		fileSelector.setAttribute('type', 'file')
		fileSelector.setAttribute('accept', `${JSON_MIME_TYPE}, ${XML_MIME_TYPE}`)
		fileSelector.onchange = moduleUploadFileSelected.bind(this, resolve, reject)
		fileSelector.click()
	})
}

const moduleUploadFileSelected = (boundResolve, boundReject, event) => {
	const file = event.target.files[0]
	if (!file) return boundResolve()
	const reader = new global.FileReader()
	reader.readAsText(file, 'UTF-8')
	reader.onload = moduleUploadFileLoaded.bind(this, boundResolve, boundReject, file.type)
}

const moduleUploadFileLoaded = async (boundResolve, boundReject, fileType, e) => {
	try {
		const body = {
			content: e.target.result,
			format: fileType === JSON_MIME_TYPE ? JSON_MIME_TYPE : XML_MIME_TYPE
		}
		await apiCreateNewModule(false, body)
		window.location.reload()
		boundResolve()
	} catch (e) {
		boundReject()
	}
}

module.exports = {
	SHOW_MODULE_PERMISSIONS,
	LOAD_USER_SEARCH,
	CLOSE_MODAL,
	ADD_USER_TO_MODULE,
	LOAD_USERS_FOR_MODULE,
	CREATE_NEW_MODULE,
	CLEAR_PEOPLE_SEARCH_RESULTS,
	DELETE_MODULE_PERMISSIONS,
	DELETE_MODULE,
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
	RESTORE_VERSION,
	IMPORT_MODULE_FILE,
	CHECK_MODULE_LOCK,
	filterModules,
	filterCollections,
	deleteModule,
	closeModal,
	deleteModulePermissions,
	searchForUser,
	addUserToModule,
	createNewCollection,
	createNewModule,
	showModulePermissions,
	loadUsersForModule,
	clearPeopleSearchResults,
	showModuleMore,
	showCollectionManageModules,
	loadCollectionModules,
	collectionAddModule,
	collectionRemoveModule,
	searchForModuleNotInCollection,
	clearModuleSearchResults,
	showCollectionRename,
	showModuleManageCollections,
	loadModuleCollections,
	moduleAddToCollection,
	moduleRemoveFromCollection,
	renameCollection,
	deleteCollection,
	showVersionHistory,
	restoreVersion,
	importModuleFile,
	checkModuleLock
}
