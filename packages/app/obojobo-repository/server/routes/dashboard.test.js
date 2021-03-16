jest.mock('../models/collection_summary')
jest.mock('../models/draft_summary')
jest.mock('../models/draft_permissions')
jest.mock('../services/count')
jest.mock('short-uuid')
jest.unmock('fs') // need fs working for view rendering
jest.unmock('express') // we'll use supertest + express for this
jest.mock(
	'obojobo-express/server/asset_resolver',
	() => ({
		assetForEnv: path => path,
		webpackAssetPath: path => path
	}),
	{ virtual: true }
)

jest.setTimeout(10000) // extend test timeout?

// override requireCurrentUser for tests to provide our own user
let mockCurrentUser

jest.mock('obojobo-express/server/express_current_user', () => (req, res, next) => {
	req.requireCurrentUser = () => {
		req.currentUser = mockCurrentUser
		return Promise.resolve(mockCurrentUser)
	}
	req.getCurrentUser = () => {
		req.currentUser = mockCurrentUser
		return Promise.resolve(mockCurrentUser)
	}
	next()
})

let mockDashboardComponent
let mockDashboardComponentConstructor
jest.mock('obojobo-repository/shared/components/pages/page-dashboard-server')

const { MODE_RECENT, MODE_ALL, MODE_COLLECTION } = require('../../shared/repository-constants')

const componentPropsDesiredProperties = [
	'title',
	'collection',
	'currentUser',
	'mode',
	'moduleCount',
	'moduleSortOrder',
	'collectionSortOrder',
	'myCollections',
	'myModules'
]

let CollectionSummary
let DraftSummary
let CountServices
let DraftPermissions
let short

// setup express server
const path = require('path')
const request = require('supertest')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

// register express-react-views template engine if not already registered
app.engine('jsx', require('express-react-views-custom').createEngine())

app.set('view engine', 'jsx')

let viewPaths = app.get('views')
if (!Array.isArray(viewPaths)) viewPaths = [viewPaths]
viewPaths.push(path.resolve(`${__dirname}/../../shared/components`)) // add the components dir so babel can transpile the jsx
app.set('views', viewPaths)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(require('obojobo-express/server/express_current_user'))

app.use('/', require('obojobo-express/server/express_response_decorator'))
app.use('/', require('obojobo-repository/server/routes/dashboard'))

describe('repository dashboard route', () => {
	const mockSingleCollection = { id: 'mockCollectionId', title: 'mockCollectionTitle' }

	const mockCollectionSummary = [
		{
			id: 'mockCollectionId',
			title: 'mockCollectionTitle'
		},
		{
			id: 'mockCollectionId2',
			title: 'mockCollectionTitle2'
		},
		{
			id: 'mockCollectionId3',
			title: 'mockCollectionTitle3'
		}
	]

	const mockModuleSummary = [
		{
			draftId: 'mockDraftId',
			title: 'mockDraftTitle'
		},
		{
			draftId: 'mockDraftId2',
			title: 'mockDraftTitle2'
		},
		{
			draftId: 'mockDraftId3',
			title: 'mockDraftTitle3'
		}
	]

	beforeEach(() => {
		jest.resetAllMocks()
		mockCurrentUser = {
			id: 99,
			canPreviewDrafts: true
		}
		CollectionSummary = require('../models/collection_summary')
		DraftSummary = require('../models/draft_summary')
		CountServices = require('../services/count')
		DraftSummary = require('../models/draft_summary')
		DraftPermissions = require('../models/draft_permissions')

		//there's extra express garbage attached to the props we care about
		//this roundabout solution exists to only pull out the ones we want
		mockDashboardComponentConstructor = jest.fn()
		mockDashboardComponent = require('obojobo-repository/shared/components/pages/page-dashboard-server')
		mockDashboardComponent.mockImplementation(props => {
			const desiredProps = {}
			componentPropsDesiredProperties.forEach(prop => {
				desiredProps[prop] = props[prop]
			})
			mockDashboardComponentConstructor(desiredProps)
			return ''
		})

		short = require('short-uuid')
	})

	const generateCookie = (type = 'module', path = 'dashboard', order = 'alphabetical') => {
		const expires = new Date()
		expires.setFullYear(expires.getFullYear() + 1)
		const commonCookieString = `expires=${expires.toUTCString()}; path=${path}`
		return `${type}SortOrder=${order}; ${commonCookieString}`
	}

	test('get /dashboard sends the correct props to the Dashboard component', () => {
		expect.hasAssertions()

		CountServices.getUserModuleCount.mockResolvedValueOnce(5)

		CollectionSummary.fetchByUserId = jest.fn()
		CollectionSummary.fetchByUserId.mockResolvedValueOnce(mockCollectionSummary)

		DraftSummary.fetchAllInCollection = jest.fn()
		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchRecentByUserId = jest.fn()

		DraftSummary.fetchRecentByUserId.mockResolvedValueOnce(mockModuleSummary)

		return request(app)
			.get('/dashboard')
			.set('cookie', [generateCookie()])
			.then(response => {
				expect(CountServices.getUserModuleCount).toHaveBeenCalledTimes(1)
				expect(CountServices.getUserModuleCount).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledTimes(1)
				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchRecentByUserId).toHaveBeenCalledTimes(1)
				expect(DraftSummary.fetchRecentByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchAllInCollection).not.toHaveBeenCalled()
				expect(DraftSummary.fetchByUserId).not.toHaveBeenCalled()

				expect(mockDashboardComponent).toHaveBeenCalledTimes(1)
				expect(mockDashboardComponentConstructor).toHaveBeenCalledWith({
					title: 'Dashboard',
					collection: {
						id: null,
						title: null
					},
					currentUser: mockCurrentUser,
					mode: MODE_RECENT,
					moduleCount: 5,
					moduleSortOrder: 'last updated',
					collectionSortOrder: 'alphabetical',
					myCollections: mockCollectionSummary,
					myModules: mockModuleSummary
				})
				expect(response.statusCode).toBe(200)
			})
	})

	test('get /dashboard/all sends the correct props to the Dashboard component with cookies set', () => {
		expect.hasAssertions()

		CountServices.getUserModuleCount.mockResolvedValueOnce(5)

		CollectionSummary.fetchByUserId = jest.fn()
		CollectionSummary.fetchByUserId.mockResolvedValueOnce(mockCollectionSummary)

		DraftSummary.fetchAllInCollection = jest.fn()
		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchRecentByUserId = jest.fn()

		DraftSummary.fetchByUserId.mockResolvedValueOnce(mockModuleSummary)

		return request(app)
			.get('/dashboard/all')
			.set('cookie', [generateCookie('module', 'dashboard/all', 'last updated')])
			.then(response => {
				expect(CountServices.getUserModuleCount).toHaveBeenCalledTimes(1)
				expect(CountServices.getUserModuleCount).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledTimes(1)
				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchByUserId).toHaveBeenCalledTimes(1)
				expect(DraftSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchAllInCollection).not.toHaveBeenCalled()
				expect(DraftSummary.fetchRecentByUserId).not.toHaveBeenCalled()

				expect(mockDashboardComponent).toHaveBeenCalledTimes(1)
				expect(mockDashboardComponentConstructor).toHaveBeenCalledWith({
					title: 'Dashboard',
					collection: {
						id: null,
						title: null
					},
					currentUser: mockCurrentUser,
					mode: MODE_ALL,
					moduleCount: 5,
					moduleSortOrder: 'last updated',
					collectionSortOrder: 'alphabetical',
					myCollections: mockCollectionSummary,
					myModules: mockModuleSummary
				})
				expect(response.statusCode).toBe(200)
			})
	})

	test('get /dashboard/all sends the correct props to the Dashboard component with no cookies', () => {
		expect.hasAssertions()

		CountServices.getUserModuleCount.mockResolvedValueOnce(5)

		CollectionSummary.fetchByUserId = jest.fn()
		CollectionSummary.fetchByUserId.mockResolvedValueOnce(mockCollectionSummary)

		DraftSummary.fetchAllInCollection = jest.fn()
		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchRecentByUserId = jest.fn()

		DraftSummary.fetchByUserId.mockResolvedValueOnce(mockModuleSummary)

		return request(app)
			.get('/dashboard/all')
			.set('cookie', [''])
			.then(response => {
				expect(CountServices.getUserModuleCount).toHaveBeenCalledTimes(1)
				expect(CountServices.getUserModuleCount).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledTimes(1)
				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchByUserId).toHaveBeenCalledTimes(1)
				expect(DraftSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchAllInCollection).not.toHaveBeenCalled()
				expect(DraftSummary.fetchRecentByUserId).not.toHaveBeenCalled()

				expect(mockDashboardComponent).toHaveBeenCalledTimes(1)
				expect(mockDashboardComponentConstructor).toHaveBeenCalledWith({
					title: 'Dashboard',
					collection: {
						id: null,
						title: null
					},
					currentUser: mockCurrentUser,
					mode: MODE_ALL,
					moduleCount: 5,
					moduleSortOrder: 'newest',
					collectionSortOrder: 'alphabetical',
					myCollections: mockCollectionSummary,
					myModules: mockModuleSummary
				})
				expect(response.statusCode).toBe(200)
			})
	})

	test('get /collections/:nameOrId sends the correct props to the Dashboard component with cookies set and the collection exists and the user owns the collection', () => {
		expect.hasAssertions()

		const mockShortToUUID = jest.fn()
		mockShortToUUID.mockReturnValue('mockCollectionLongId')
		short.mockReturnValue({
			toUUID: mockShortToUUID
		})

		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(true)

		CountServices.getUserModuleCount.mockResolvedValueOnce(5)

		CollectionSummary.fetchById = jest.fn()
		CollectionSummary.fetchById.mockResolvedValueOnce(mockSingleCollection)

		CollectionSummary.fetchByUserId = jest.fn()
		CollectionSummary.fetchByUserId.mockResolvedValueOnce(mockCollectionSummary)

		DraftSummary.fetchAllInCollection = jest.fn()
		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchRecentByUserId = jest.fn()

		DraftSummary.fetchAllInCollection.mockResolvedValueOnce(mockModuleSummary)

		const path = 'collections/mock-collection-safe-name-mockCollectionShortId'

		return request(app)
			.get(`/${path}`)
			.set('cookie', [generateCookie('collection', path, 'newest')])
			.then(response => {
				expect(mockShortToUUID).toHaveBeenCalledTimes(1)
				expect(mockShortToUUID).toHaveBeenCalledWith('mockCollectionShortId')

				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledTimes(1)
				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledWith(
					mockCurrentUser.id,
					'mockCollectionLongId'
				)

				expect(CollectionSummary.fetchById).toHaveBeenCalledTimes(1)
				expect(CollectionSummary.fetchById).toHaveBeenCalledWith('mockCollectionLongId')

				expect(CountServices.getUserModuleCount).toHaveBeenCalledTimes(1)
				expect(CountServices.getUserModuleCount).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledTimes(1)
				expect(CollectionSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(DraftSummary.fetchAllInCollection).toHaveBeenCalledTimes(1)
				expect(DraftSummary.fetchAllInCollection).toHaveBeenCalledWith(
					mockSingleCollection.id,
					mockCurrentUser.id
				)

				expect(DraftSummary.fetchByUserId).not.toHaveBeenCalled()
				expect(DraftSummary.fetchRecentByUserId).not.toHaveBeenCalled()

				expect(mockDashboardComponent).toHaveBeenCalledTimes(1)
				expect(mockDashboardComponentConstructor).toHaveBeenCalledWith({
					title: 'View Collection',
					collection: mockSingleCollection,
					currentUser: mockCurrentUser,
					mode: MODE_COLLECTION,
					moduleCount: 5,
					moduleSortOrder: 'newest',
					collectionSortOrder: 'newest',
					myCollections: mockCollectionSummary,
					myModules: mockModuleSummary
				})
				expect(response.statusCode).toBe(200)
			})
	})

	test('get /collections/:nameOrId sends the correct response when the collection exists but the user does not own the collection', () => {
		expect.hasAssertions()

		const mockShortToUUID = jest.fn()
		mockShortToUUID.mockReturnValue('mockCollectionLongId')
		short.mockReturnValue({
			toUUID: mockShortToUUID
		})

		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(false)

		CollectionSummary.fetchById = jest.fn()

		CollectionSummary.fetchByUserId = jest.fn()

		DraftSummary.fetchAllInCollection = jest.fn()
		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchRecentByUserId = jest.fn()

		const path = 'collections/mock-collection-safe-name-mockCollectionShortId'

		return request(app)
			.get(`/${path}`)
			.set('cookie', [''])
			.then(response => {
				expect(mockShortToUUID).toHaveBeenCalledTimes(1)
				expect(mockShortToUUID).toHaveBeenCalledWith('mockCollectionShortId')

				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledTimes(1)
				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledWith(
					mockCurrentUser.id,
					'mockCollectionLongId'
				)

				expect(CollectionSummary.fetchById).not.toHaveBeenCalled()

				expect(CountServices.getUserModuleCount).not.toHaveBeenCalled()

				expect(CollectionSummary.fetchByUserId).not.toHaveBeenCalled()

				expect(DraftSummary.fetchAllInCollection).not.toHaveBeenCalled()
				expect(DraftSummary.fetchByUserId).not.toHaveBeenCalled()
				expect(DraftSummary.fetchRecentByUserId).not.toHaveBeenCalled()

				expect(mockDashboardComponent).not.toHaveBeenCalled()
				expect(response.statusCode).toBe(401)
			})
	})

	test('get /collections/:nameOrId sends the correct response when the user owns the collection but a database error occurs', () => {
		expect.hasAssertions()

		const mockShortToUUID = jest.fn()
		mockShortToUUID.mockReturnValue('mockCollectionLongId')
		short.mockReturnValue({
			toUUID: mockShortToUUID
		})

		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(true)

		CollectionSummary.fetchById = jest.fn()
		CollectionSummary.fetchById.mockRejectedValueOnce(new Error('database error'))

		CollectionSummary.fetchByUserId = jest.fn()

		DraftSummary.fetchAllInCollection = jest.fn()
		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchRecentByUserId = jest.fn()

		const path = '/collections/mock-collection-safe-name-mockCollectionShortId'

		return request(app)
			.get(path)
			.set('cookie', [''])
			.then(response => {
				expect(mockShortToUUID).toHaveBeenCalledTimes(1)
				expect(mockShortToUUID).toHaveBeenCalledWith('mockCollectionShortId')

				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledTimes(1)
				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledWith(
					mockCurrentUser.id,
					'mockCollectionLongId'
				)

				expect(CollectionSummary.fetchById).toHaveBeenCalledTimes(1)
				expect(CollectionSummary.fetchById).toHaveBeenCalledWith('mockCollectionLongId')

				expect(CountServices.getUserModuleCount).not.toHaveBeenCalled()

				expect(CollectionSummary.fetchByUserId).not.toHaveBeenCalled()

				expect(DraftSummary.fetchAllInCollection).not.toHaveBeenCalled()
				expect(DraftSummary.fetchByUserId).not.toHaveBeenCalled()
				expect(DraftSummary.fetchRecentByUserId).not.toHaveBeenCalled()

				expect(mockDashboardComponent).not.toHaveBeenCalled()
				expect(response.statusCode).toBe(404)
			})
	})
})
