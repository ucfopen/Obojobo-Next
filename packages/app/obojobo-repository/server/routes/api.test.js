jest.mock('../models/collection')
jest.mock('../models/draft_summary')
jest.mock('obojobo-express/server/models/draft')
jest.mock('../models/draft_permissions')
jest.mock('../models/drafts_metadata')
jest.mock('../services/search')
jest.mock('obojobo-express/server/models/user')
jest.mock('obojobo-express/server/insert_event')
jest.unmock('fs') // need fs working for view rendering
jest.unmock('express') // we'll use supertest + express for this

let Collection
let DraftSummary
let Draft
let DraftsMetadata
let SearchServices
let UserModel
let insertEvent
let DraftPermissions

// override requireCurrentUser for tests to provide our own user
let mockCurrentUser

// override requireCurrentDocument for tests to provide our own document
let mockCurrentDocument

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

jest.mock('obojobo-express/server/express_current_document', () => (req, res, next) => {
	req.requireCurrentDocument = () => {
		mockCurrentDocument.draftId = req.params.draftId
		req.currentDocument = mockCurrentDocument
		return Promise.resolve(mockCurrentDocument)
	}
	next()
})

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
app.use(require('obojobo-express/server/express_current_document'))

app.use('/', require('obojobo-express/server/express_response_decorator'))
app.use('/', require('obojobo-repository/server/routes/api'))

describe('repository api route', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		mockCurrentUser = {
			id: 99,
			canViewEditor: true,
			canPreviewDrafts: true,
			canCreateDrafts: true,
			canDeleteDrafts: true
		}
		mockCurrentDocument = {}
		Collection = require('../models/collection')
		DraftSummary = require('../models/draft_summary')
		Draft = require('obojobo-express/server/models/draft')
		DraftsMetadata = require('../models/drafts_metadata')
		SearchServices = require('../services/search')
		DraftPermissions = require('../models/draft_permissions')
		UserModel = require('obojobo-express/server/models/user')
		insertEvent = require('obojobo-express/server/insert_event')
	})

	test('get /drafts-public returns the expected response', () => {
		expect.hasAssertions()

		const publicLibCollectionId = require('../../shared/publicLibCollectionId')

		const mockResult = [
			{ draftId: 'mockDraftId1' },
			{ draftId: 'mockDraftId2' },
			{ draftId: 'mockDraftId3' }
		]
		const loadRelatedDraftsMock = jest.fn()
		const mockCollection = {
			loadRelatedDrafts: loadRelatedDraftsMock,
			// This would normally be set by loadRelatedDrafts,
			// but we test all that elsewhere - just mock it here
			drafts: mockResult
		}

		mockCollection.loadRelatedDrafts.mockResolvedValueOnce(mockCollection)

		Collection.fetchById = jest.fn()
		Collection.fetchById.mockResolvedValueOnce(mockCollection)

		return request(app)
			.get('/drafts-public')
			.then(response => {
				expect(Collection.fetchById).toHaveBeenCalledWith(publicLibCollectionId)
				expect(loadRelatedDraftsMock).toHaveBeenCalledTimes(1)
				expect(response.statusCode).toBe(200)
				expect(response.body).toStrictEqual(mockResult)
			})
	})

	test('get /drafts returns the expected response', () => {
		const mockResult = [
			{ draftId: 'mockDraftId1', title: 'whatever1' },
			{ draftId: 'mockDraftId2', title: 'whatever2' },
			{ draftId: 'mockDraftId3', title: 'whatever3' }
		]

		DraftSummary.fetchByUserId = jest.fn()
		DraftSummary.fetchByUserId.mockResolvedValueOnce(mockResult)

		expect.hasAssertions()

		return request(app)
			.get('/drafts')
			.then(response => {
				expect(DraftSummary.fetchByUserId).toHaveBeenCalledWith(mockCurrentUser.id)

				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(mockResult)
			})
	})

	test('get /drafts/:draftId/revisions/ returns the expected response, no after - hasMoreResults false', () => {
		const mockResult = {
			revisions: [
				{
					draftId: 'mockDraftId',
					revisionId: 'mockRevisionId1'
				},
				{
					draftId: 'mockDraftId',
					revisionId: 'mockRevisionId2'
				}
			],
			hasMoreResults: false
		}

		DraftSummary.fetchAllDraftRevisions = jest.fn()
		DraftSummary.fetchAllDraftRevisions.mockResolvedValueOnce(mockResult)

		expect.hasAssertions()

		return request(app)
			.get('/drafts/mockDraftId/revisions/')
			.then(response => {
				// query.after is optional - will be undefined otherwise
				// eslint-disable-next-line no-undefined
				expect(DraftSummary.fetchAllDraftRevisions).toHaveBeenCalledWith('mockDraftId', undefined)

				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(mockResult.revisions)
				expect(response.links).toEqual({})
			})
	})
	test('get /drafts/:draftId/revisions/ returns the expected response, no after - hasMoreResults true', () => {
		const mockResult = {
			revisions: [
				{
					draftId: 'mockDraftId',
					revisionId: 'mockRevisionId1'
				},
				{
					draftId: 'mockDraftId',
					revisionId: 'mockRevisionId2'
				}
			],
			hasMoreResults: true
		}

		DraftSummary.fetchAllDraftRevisions = jest.fn()
		DraftSummary.fetchAllDraftRevisions.mockResolvedValueOnce(mockResult)

		expect.hasAssertions()

		return request(app)
			.get('/drafts/mockDraftId/revisions/')
			.then(response => {
				// query.after is optional - will be undefined otherwise
				// eslint-disable-next-line no-undefined
				expect(DraftSummary.fetchAllDraftRevisions).toHaveBeenCalledWith('mockDraftId', undefined)

				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(mockResult.revisions)
				expect(response.links).toHaveProperty('next')
				const nextLinkRegex = new RegExp(
					/^http:\/\/(.*)\/drafts\/mockDraftId\/revisions\/\?after=mockRevisionId2$/
				)
				expect(response.links.next).toEqual(expect.stringMatching(nextLinkRegex))
			})
	})
	test('get /drafts/:draftId/revisions/ returns the expected response, after - hasMoreResults false', () => {
		// after ID has to be a valid UUID and we can't mock the helper function, so...
		const mockAfterUUID = '00000000-0000-0000-0000-000000000000'

		const mockResult = {
			revisions: [
				{
					draftId: 'mockDraftId',
					revisionId: 'mockRevisionId1'
				},
				{
					draftId: 'mockDraftId',
					revisionId: 'mockRevisionId2'
				}
			],
			hasMoreResults: false
		}

		DraftSummary.fetchAllDraftRevisions = jest.fn()
		DraftSummary.fetchAllDraftRevisions.mockResolvedValueOnce(mockResult)

		expect.hasAssertions()

		return request(app)
			.get(`/drafts/mockDraftId/revisions?after=${mockAfterUUID}`)
			.then(response => {
				expect(DraftSummary.fetchAllDraftRevisions).toHaveBeenCalledWith(
					'mockDraftId',
					mockAfterUUID
				)

				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(mockResult.revisions)
				expect(response.links).toEqual({})
			})
	})
	test('get /drafts/:draftId/revisions/ catches unexpected errors correctly', () => {
		expect.hasAssertions()

		DraftSummary.fetchAllDraftRevisions.mockRejectedValueOnce('database error')

		return request(app)
			.get('/drafts/mockDraftId/revisions')
			.then(response => {
				expect(response.statusCode).toBe(500)
				expect(response.error).toHaveProperty('text', 'Server Error: database error')
			})
	})

	test('get /drafts/:draftId/revisions/:revisionId returns the expected response', () => {
		// revision ID has to be a valid UUID and we can't mock the helper function, so...
		const mockRevisionUUID = '00000000-0000-0000-0000-000000000000'

		const mockResult = {
			draftId: 'mockDraftId',
			revisionId: mockRevisionUUID,
			title: 'whatever1'
		}

		DraftSummary.fetchDraftRevisionById = jest.fn()
		DraftSummary.fetchDraftRevisionById.mockResolvedValueOnce(mockResult)

		expect.hasAssertions()

		return request(app)
			.get(`/drafts/mockDraftId/revisions/${mockRevisionUUID}`)
			.then(response => {
				expect(DraftSummary.fetchDraftRevisionById).toHaveBeenCalledWith(
					'mockDraftId',
					mockRevisionUUID
				)

				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual(mockResult)
			})
	})

	test('get /users/search returns the expected response when given a search string', () => {
		expect.hasAssertions()

		const mockResult = [
			{ toJSON: jest.fn(() => ({ id: 1 })) },
			{ toJSON: jest.fn(() => ({ id: 2 })) },
			{ toJSON: jest.fn(() => ({ id: 3 })) }
		]

		SearchServices.searchForUserByString.mockResolvedValueOnce(mockResult)

		return request(app)
			.get('/users/search?q=searchString')
			.then(response => {
				expect(SearchServices.searchForUserByString).toHaveBeenCalledTimes(1)
				expect(SearchServices.searchForUserByString).toHaveBeenCalledWith('searchString')
				expect(response.statusCode).toBe(200)
				expect(response.body).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
			})
	})

	test('get /users/search returns the expected response when given no search string', () => {
		expect.hasAssertions()

		return request(app)
			.get('/users/search?q=')
			.then(response => {
				expect(SearchServices.searchForUserByString).not.toHaveBeenCalled()
				expect(response.statusCode).toBe(200)
				expect(response.body).toStrictEqual([])
			})
	})

	test('get /users/search handles thrown errors', () => {
		expect.hasAssertions()

		SearchServices.searchForUserByString.mockRejectedValueOnce('database error')

		return request(app)
			.get('/users/search?q=searchString')
			.then(response => {
				expect(SearchServices.searchForUserByString).toHaveBeenCalledTimes(1)
				expect(SearchServices.searchForUserByString).toHaveBeenCalledWith('searchString')
				expect(response.statusCode).toBe(500)
				expect(response.error).toHaveProperty('text', 'Server Error: database error')
			})
	})

	test('post /drafts/:draftId/copy returns the expected response when user can copy draft', () => {
		expect.hasAssertions()

		const mockDraftObject = {
			id: 'mockNewDraftId',
			content: {
				id: 'mockNewDraftContentId',
				title: 'mockDraftTitle'
			}
		}

		const mockDraftRootToObject = jest.fn()
		mockDraftRootToObject.mockReturnValueOnce(mockDraftObject)

		const mockDraft = {
			root: {
				toObject: mockDraftRootToObject
			}
		}

		DraftPermissions.userHasPermissionToCopy.mockResolvedValueOnce(true)

		Draft.fetchById = jest.fn()
		Draft.fetchById.mockResolvedValueOnce(mockDraft)
		Draft.createWithContent.mockResolvedValueOnce(mockDraftObject)

		return request(app)
			.post('/drafts/mockDraftId/copy')
			.send({ visitId: 'mockVisitId' })
			.then(response => {
				expect(DraftPermissions.userHasPermissionToCopy).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(Draft.fetchById).toHaveBeenCalledWith(mockCurrentDocument.draftId)
				expect(mockDraftObject.content.title).toEqual('mockDraftTitle Copy')
				expect(Draft.createWithContent).toHaveBeenCalledWith(mockCurrentUser.id, mockDraftObject)
				expect(DraftsMetadata).toHaveBeenCalledWith({
					draft_id: 'mockNewDraftId',
					key: 'copied',
					value: mockCurrentDocument.draftId
				})
				expect(DraftsMetadata.mock.instances[0].saveOrCreate).toHaveBeenCalledTimes(1)
				expect(insertEvent).toHaveBeenCalledWith({
					actorTime: 'now()',
					action: 'draft:copy',
					userId: mockCurrentUser.id,
					ip: '::ffff:127.0.0.1', //any way to set req.connection.remoteAddress?
					metadata: {},
					payload: { from: mockCurrentDocument.draftId },
					draftId: 'mockNewDraftId',
					contentId: 'mockNewDraftContentId',
					eventVersion: '1.0.0',
					isPreview: false,
					visitId: 'mockVisitId'
				})
				expect(response.statusCode).toBe(200)
			})
	})

	test('post /drafts/:draftId/copy sets title if one is provided', () => {
		expect.hasAssertions()

		const mockDraftObject = {
			id: 'mockNewDraftId',
			content: {
				id: 'mockNewDraftContentId',
				title: 'mockDraftTitle'
			}
		}

		const mockDraftRootToObject = jest.fn()
		mockDraftRootToObject.mockReturnValueOnce(mockDraftObject)

		const mockDraft = {
			root: {
				toObject: mockDraftRootToObject
			}
		}

		DraftPermissions.userHasPermissionToCopy.mockResolvedValueOnce(true)

		Draft.fetchById = jest.fn()
		Draft.fetchById.mockResolvedValueOnce(mockDraft)
		Draft.createWithContent.mockResolvedValueOnce(mockDraftObject)

		return request(app)
			.post('/drafts/mockDraftId/copy')
			.send({ visitId: 'mockVisitId', title: 'New Draft Title' })
			.then(() => {
				expect(mockDraftObject.content.title).toEqual('New Draft Title')
				// everything else is unchanged from above
			})
	})

	test('post /drafts/:draftId/copy returns the expected response when user can not copy draft', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToCopy.mockResolvedValueOnce(false)

		return request(app)
			.post('/drafts/mockDraftId/copy')
			.then(response => {
				expect(DraftPermissions.userHasPermissionToCopy).toHaveBeenCalledTimes(1)
				expect(DraftPermissions.userHasPermissionToCopy).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(response.statusCode).toBe(401)
			})
	})

	test('post /drafts/:draftId/copy handles thrown errors', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToCopy.mockRejectedValueOnce('database error')

		return request(app)
			.post('/drafts/mockDraftId/copy')
			.then(response => {
				expect(DraftPermissions.userHasPermissionToCopy).toHaveBeenCalledTimes(1)
				expect(DraftPermissions.userHasPermissionToCopy).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(response.statusCode).toBe(500)
				expect(response.error).toHaveProperty('text', 'Server Error: database error')
			})
	})

	test('get /drafts/:draftId/permission returns the expected response', () => {
		expect.hasAssertions()
		const userToJSON = jest.fn().mockReturnValue('filtered-user')
		DraftPermissions.getDraftOwners.mockResolvedValueOnce([
			{ toJSON: userToJSON },
			{ toJSON: userToJSON }
		])

		return request(app)
			.get('/drafts/mockDraftId/permission')
			.then(response => {
				expect(DraftPermissions.getDraftOwners).toHaveBeenCalledWith(mockCurrentDocument.draftId)
				expect(response.body).toEqual(['filtered-user', 'filtered-user'])
				expect(response.statusCode).toBe(200)
			})
	})

	test('post /drafts/:draftId/permission runs correctly when current user has perms to draft', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(true)
		DraftPermissions.addOwnerToDraft.mockResolvedValueOnce()

		UserModel.fetchById = jest.fn()
		UserModel.fetchById.mockResolvedValueOnce(true)

		return request(app)
			.post('/drafts/mockDraftId/permission')
			.send({ userId: 1 })
			.then(response => {
				expect(DraftPermissions.userHasPermissionToDraft).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(UserModel.fetchById).toHaveBeenCalledWith(1)
				expect(DraftPermissions.addOwnerToDraft).toHaveBeenCalledWith(
					mockCurrentDocument.draftId,
					1
				)
				expect(response.statusCode).toBe(200)
			})
	})

	test('post /drafts/:draftId/permission runs correctly when current user does not have perms to draft', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(false)
		UserModel.fetchById = jest.fn()

		return request(app)
			.post('/drafts/mockDraftId/permission')
			.send({ userId: 1 })
			.then(response => {
				expect(DraftPermissions.userHasPermissionToDraft).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(UserModel.fetchById).not.toHaveBeenCalled()
				expect(DraftPermissions.addOwnerToDraft).not.toHaveBeenCalled()
				expect(response.statusCode).toBe(401)
			})
	})

	test('post /drafts/:draftId/permission catches unexpected errors correctly', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(true)
		UserModel.fetchById = jest.fn()
		UserModel.fetchById.mockResolvedValueOnce(true)
		DraftPermissions.addOwnerToDraft.mockRejectedValueOnce('database error')

		return request(app)
			.post('/drafts/mockDraftId/permission')
			.send({ userId: 1 })
			.then(response => {
				expect(DraftPermissions.userHasPermissionToDraft).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(UserModel.fetchById).toHaveBeenCalledWith(1)
				expect(DraftPermissions.addOwnerToDraft).toHaveBeenCalledWith(
					mockCurrentDocument.draftId,
					1
				)
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value.message).toBe('database error')
			})
	})

	test('delete /drafts/:draftId/permission/:userId runs correctly when current user has perms to draft', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(true)
		UserModel.fetchById = jest.fn()
		UserModel.fetchById.mockResolvedValueOnce({ id: 1 })
		DraftPermissions.removeOwnerFromDraft.mockResolvedValueOnce(true)

		return request(app)
			.delete('/drafts/mockDraftId/permission/1')
			.then(response => {
				expect(DraftPermissions.userHasPermissionToDraft).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(UserModel.fetchById).toHaveBeenCalledWith('1')
				expect(DraftPermissions.removeOwnerFromDraft).toHaveBeenCalledWith(
					mockCurrentDocument.draftId,
					1
				)
				expect(response.statusCode).toBe(200)
			})
	})

	test('delete /drafts/:draftId/permission/:userId runs correctly when current user does not have perms to draft', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(false)
		UserModel.fetchById = jest.fn()

		return request(app)
			.delete('/drafts/mockDraftId/permission/1')
			.then(response => {
				expect(DraftPermissions.userHasPermissionToDraft).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(UserModel.fetchById).not.toHaveBeenCalled()
				expect(DraftPermissions.removeOwnerFromDraft).not.toHaveBeenCalled()
				expect(response.statusCode).toBe(401)
			})
	})

	test('delete /drafts/:draftId/permission/:userId catches unexpected errors correctly', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(true)
		UserModel.fetchById = jest.fn()
		UserModel.fetchById.mockResolvedValueOnce({ id: 1 })
		DraftPermissions.removeOwnerFromDraft.mockRejectedValueOnce('database error')

		return request(app)
			.delete('/drafts/mockDraftId/permission/1')
			.then(response => {
				expect(DraftPermissions.userHasPermissionToDraft).toHaveBeenCalledWith(
					mockCurrentUser.id,
					mockCurrentDocument.draftId
				)
				expect(UserModel.fetchById).toHaveBeenCalledWith('1')
				expect(DraftPermissions.removeOwnerFromDraft).toHaveBeenCalledWith(
					mockCurrentDocument.draftId,
					1
				)
				expect(response.statusCode).toBe(500)
				expect(response.error).toHaveProperty('text', 'Server Error: database error')
			})
	})
})
