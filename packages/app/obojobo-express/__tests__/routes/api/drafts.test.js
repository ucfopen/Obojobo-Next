jest.mock('obojobo-repository/server/models/collection')
jest.mock('../../../server/models/draft')
jest.mock('../../../server/models/user')
jest.mock('../../../server/db')
jest.mock('../../../server/logger')
jest.mock('obojobo-document-xml-parser/xml-to-draft-object')
jest.mock('obojobo-document-json-parser/json-to-xml-parser')
jest.mock('obojobo-repository/server/models/draft_permissions')

import DraftModel from '../../../server/models/draft'
const CollectionModel = require('obojobo-repository/server/models/collection')
const xml = require('obojobo-document-xml-parser/xml-to-draft-object')
const jsonToXml = require('obojobo-document-json-parser/json-to-xml-parser')
const DraftPermissions = require('obojobo-repository/server/models/draft_permissions')

// don't use our existing express mock, we're using supertest
jest.unmock('express')
// Load an example default Obojobo middleware
const request = require('supertest')
const express = require('express')
const pgp = require('pg-promise')
const app = express()

const basicXML = `<ObojoboDraftDoc>
	<Module title="My Module">
		<Content>
			<Page>
				<p>Hello World!</p>
			</Page>
		</Content>
	</Module>
</ObojoboDraftDoc>`

const mockInsertNewDraft = mockVirtual('./server/routes/api/drafts/insert_new_draft')
const db = oboRequire('server/db')
const drafts = oboRequire('server/routes/api/drafts')

let mockCurrentUser

const mockGetCurrentUser = jest.fn().mockImplementation(req => {
	req.currentUser = mockCurrentUser
	return Promise.resolve(mockCurrentUser)
})

jest.mock('../../../server/express_current_user', () => (req, res, next) => {
	req.getCurrentUser = mockGetCurrentUser.bind(this, req)
	req.requireCurrentUser = mockGetCurrentUser.bind(this, req)
	next()
})

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(oboRequire('server/express_current_user'))
app.use('/', oboRequire('server/express_response_decorator'))
app.use('/api/drafts', drafts)

describe('api draft route', () => {
	beforeAll(() => {})
	afterAll(() => {})
	beforeEach(() => {
		mockInsertNewDraft.mockReset()
		DraftModel.fetchById.mockReset()
		DraftModel.findDuplicateIds.mockReset()
		DraftModel.fetchDraftByVersion.mockReset()
		db.none.mockReset()
		db.any.mockReset()
		xml.mockReset()
		jsonToXml.mockReset()
		DraftPermissions.userHasPermissionToDraft.mockReset()
		DraftPermissions.userHasPermissionToDraft.mockResolvedValue(true)
		CollectionModel.addModule.mockReset()
	})
	afterEach(() => {})

	test('get full draft returns xml without conversion for non-json modules when accept header is xml', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()
		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(basicXML)
		})

		DraftModel.fetchById.mockResolvedValueOnce(mockDraftModel)

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.set('Accept', 'application/xml')
			.then(response => {
				expect(response.header['content-type']).toContain('application/xml')
				expect(response.statusCode).toBe(200)
				expect(mockYell).not.toHaveBeenCalled()
				expect(response.text).toBe(basicXML)
				expect(jsonToXml).not.toHaveBeenCalled()
			})
	})

	test('get full draft converts json to xml for json modules when accept header is xml', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchById.mockResolvedValueOnce(mockDraftModel)

		jsonToXml.mockReturnValueOnce('mock-xml')

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(null) // pretend we don't have xml
		})

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.set('Accept', 'application/xml')
			.then(response => {
				expect(response.header['content-type']).toContain('application/xml')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('mock-xml')
				expect(jsonToXml).toHaveBeenCalledWith('mock-document-json')
			})
	})

	test('get full draft returns json for json modules when accept headers is json', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchById.mockResolvedValueOnce(mockDraftModel)

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(null) // pretend we don't have xml
		})

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.set('Accept', 'application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-document-json')
				expect(jsonToXml).not.toHaveBeenCalled()
			})
	})

	test('get full draft returns a specific version when requested', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchDraftByVersion.mockResolvedValueOnce(mockDraftModel)

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(null) // pretend we don't have xml
		})

		return request(app)
			.get(
				'/api/drafts/00000000-0000-0000-0000-000000000000/full?contentId=00000000-0000-0000-0000-000000000001'
			)
			.set('Accept', 'application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-document-json')
				expect(DraftModel.fetchDraftByVersion).toHaveBeenCalledWith(
					'00000000-0000-0000-0000-000000000000',
					'00000000-0000-0000-0000-000000000001'
				)
				expect(DraftModel.fetchById).not.toHaveBeenCalled()
			})
	})

	test('get full draft errors on invalid contentId query value', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchDraftByVersion.mockResolvedValueOnce(mockDraftModel)

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(null) // pretend we don't have xml
		})

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full?contentId=myFavorite')
			.set('Accept', 'application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(422)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty(
					'value.message',
					'contentId must be a valid UUID, got myFavorite'
				)
				expect(DraftModel.fetchDraftByVersion).not.toHaveBeenCalled()
				expect(DraftModel.fetchById).not.toHaveBeenCalled()
			})
	})

	test('get full draft returns json for json modules when accept header is something weird', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchById.mockResolvedValueOnce(mockDraftModel)

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(null) // pretend we don't have xml
		})

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.set('Accept', 'application/tomfoolery')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-document-json')
				expect(jsonToXml).not.toHaveBeenCalled()
			})
	})

	test('get full draft returns json for xml modules when accept header is json', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchById.mockResolvedValueOnce(mockDraftModel)

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(basicXML) // pretend we don't have xml
		})

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.set('Accept', 'application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-document-json')
			})
	})

	test('get full draft returns json for xml modules when accept header is something weird', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()

		// mock the document returned by fetchById
		const mockDraftModel = {
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		}

		DraftModel.fetchById.mockResolvedValueOnce(mockDraftModel)

		// mock the xmlDocument Getter
		Object.defineProperty(mockDraftModel, 'xmlDocument', {
			get: jest.fn().mockResolvedValue(basicXML) // pretend we don't have xml
		})

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.set('Accept', 'anything-except-xml')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-document-json')
			})
	})

	test('get full draft returns 401 if user does not have canViewEditor rights', () => {
		expect.assertions(4)
		mockCurrentUser = { id: 99, canViewEditor: false } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()
		// mock the document returned by fetchById
		DraftModel.fetchById.mockResolvedValueOnce({
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		})
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('get full draft returns 401 if user is not the author', () => {
		expect.assertions(5)
		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(false)
		mockCurrentUser = { id: 88, canViewEditor: true } // mock current logged in user
		// mock a yell function that returns a document
		const mockYell = jest.fn()
		// mock the document returned by fetchById
		DraftModel.fetchById.mockResolvedValueOnce({
			root: { yell: mockYell },
			document: 'mock-document-json',
			authorId: 99
		})
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
				expect(response.body.value).toHaveProperty(
					'message',
					'You must be the author of this draft to retrieve this information'
				)
			})
	})

	test('get full draft returns 401 if user does not have canViewEditor rights AND is not the author', () => {
		expect.assertions(4)
		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(false)
		mockCurrentUser = { id: 88, canViewEditor: false } // mock current logged in user

		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('get full draft returns 404 when no items found', () => {
		expect.assertions(5)
		mockCurrentUser = { id: 99, canViewEditor: true } // mock current logged in user
		// mock a failure to find the draft
		const mockError = new pgp.errors.QueryResultError(
			pgp.errors.queryResultErrorCode.noData,
			{ rows: [] },
			'mockQuery',
			'mockValues'
		)
		DraftModel.fetchById.mockRejectedValueOnce(mockError)
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(404)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'missing')
				expect(response.body.value).toHaveProperty('message', 'Draft not found')
			})
	})

	test('get full draft returns 500 when an unknown error occurs', () => {
		expect.assertions(5)
		// mock a failure to find the draft
		DraftModel.fetchById.mockRejectedValueOnce('mock-other-error')
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000/full')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
				expect(response.body.value).toHaveProperty('message', 'mock-other-error')
			})
	})

	// get draft

	test('get draft returns success', () => {
		expect.assertions(5)
		// mock a yell function that returns a document
		const mockYell = jest.fn()
		// mock the document returned by fetchById
		DraftModel.fetchById.mockResolvedValueOnce({
			root: { yell: mockYell },
			document: 'mock-document-json'
		})
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(mockYell).toHaveBeenCalledWith(
					'internal:sendToClient',
					expect.anything(),
					expect.anything()
				)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-document-json')
			})
	})

	test('get draft returns 404 when no items found', () => {
		expect.assertions(5)
		// mock a failure to find the draft
		const mockError = new pgp.errors.QueryResultError(
			pgp.errors.queryResultErrorCode.noData,
			{ rows: [] },
			'mockQuery',
			'mockValues'
		)
		DraftModel.fetchById.mockRejectedValueOnce(mockError)
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(404)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'missing')
				expect(response.body.value).toHaveProperty('message', 'Draft not found')
			})
	})

	test('get draft returns 500 when an unknown error occurs', () => {
		expect.assertions(5)
		// mock a failure to find the draft
		DraftModel.fetchById.mockRejectedValueOnce('mock-other-error')
		return request(app)
			.get('/api/drafts/00000000-0000-0000-0000-000000000000')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
				expect(response.body.value).toHaveProperty('message', 'mock-other-error')
			})
	})

	// new draft

	test('new draft returns success', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/new')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response).toHaveProperty('body.status', 'ok')
				expect(response).toHaveProperty('body.value.id', 'mockDraftId')
				expect(response).toHaveProperty('body.value.contentId', 'mockContentId')
			})
	})

	test('new draft with "application/json" returns success', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user

		return request(app)
			.post('/api/drafts/new')
			.send({
				moduleContent: {
					content: 'mockContent',
					format: 'application/json'
				}
			})
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response).toHaveProperty('body.status', 'ok')
				expect(response).toHaveProperty('body.value.id', 'mockDraftId')
				expect(response).toHaveProperty('body.value.contentId', 'mockContentId')
			})
	})

	test('new draft with "application/xml" returns success', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		xml.mockReturnValueOnce({})

		return request(app)
			.post('/api/drafts/new')
			.send({
				moduleContent: {
					content: 'mockContent',
					format: 'application/xml'
				}
			})
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response).toHaveProperty('body.status', 'ok')
				expect(response).toHaveProperty('body.value.id', 'mockDraftId')
				expect(response).toHaveProperty('body.value.contentId', 'mockContentId')
				expect(xml).toHaveBeenCalled()
			})
	})

	test('new draft with invalid xml', () => {
		expect.assertions(5)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		xml.mockReturnValueOnce(null)

		return request(app)
			.post('/api/drafts/new')
			.accept('text/plain')
			.send({
				moduleContent: {
					content: 'mockCont222ent',
					format: 'application/xml'
				}
			})
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
			})
	})

	test('new draft with invalid xml', () => {
		expect.assertions(5)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		xml.mockImplementation(() => {
			throw new Error()
		})

		return request(app)
			.post('/api/drafts/new')
			.accept('text/plain')
			.send({
				moduleContent: {
					content: 'mockCont222ent',
					format: 'application/xml'
				}
			})
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
			})
	})

	test('new draft requires a login', () => {
		expect.assertions(5)
		mockCurrentUser = { id: 99, canCreateDrafts: false } // mock current logged in user
		return request(app)
			.post('/api/drafts/new')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('new draft 500s when createWithContent fails', () => {
		expect.assertions(5)
		DraftModel.createWithContent.mockRejectedValueOnce()
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/new')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
			})
	})

	//when the request body has a 'collectionId' corresponding to a collection
	// owned by the current user
	test('new draft is automatically added to a specified collection', () => {
		expect.hasAssertions()

		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(true)

		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/new')
			.send({ collectionId: 'mockCollectionId' })
			.then(async response => {
				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledWith(
					99,
					'mockCollectionId'
				)
				expect(CollectionModel.addModule).toHaveBeenCalledWith(
					'mockCollectionId',
					'mockDraftId',
					99
				)

				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value.id', 'mockDraftId')
				expect(response.body).toHaveProperty('value.contentId', 'mockContentId')
			})
	})

	//when the request body has a 'collectionId' corresponding to a collection
	// not owned by the current user
	test('new draft is not created if specified collection is not owned by user', () => {
		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(false)

		expect.assertions(7)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/new')
			.send({ collectionId: 'mockCollectionId' })
			.then(async response => {
				expect(DraftPermissions.userHasPermissionToCollection).toHaveBeenCalledWith(
					99,
					'mockCollectionId'
				)
				expect(CollectionModel.addModule).not.toHaveBeenCalled()

				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	// new tutorial

	test('new tutorial returns success', () => {
		expect.hasAssertions()
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/tutorial')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response).toHaveProperty('body.status', 'ok')
				expect(response).toHaveProperty('body.value.id', 'mockDraftId')
				expect(response).toHaveProperty('body.value.contentId', 'mockContentId')
			})
	})

	test('new tutorial returns success when added to a collection', () => {
		expect.hasAssertions()
		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(true)
		CollectionModel.addModule.mockResolvedValueOnce(true)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/tutorial')
			.type('application/json')
			.send('{"collectionId":55}')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response).toHaveProperty('body.status', 'ok')
				expect(response).toHaveProperty('body.value.id', 'mockDraftId')
				expect(response).toHaveProperty('body.value.contentId', 'mockContentId')
				expect(response).toHaveProperty('body.value.collectionId', 55)
			})
	})

	test('new tutorial returns error when user does not have perms to collection', () => {
		expect.hasAssertions()
		DraftPermissions.userHasPermissionToCollection.mockResolvedValueOnce(false)
		CollectionModel.addModule.mockResolvedValueOnce(true)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/tutorial')
			.type('application/json')
			.send('{"collectionId":55}')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response).toHaveProperty('body.status', 'error')
				expect(response).toHaveProperty(
					'body.value.message',
					'You must have permissions to the requested collection to add a new module to it.'
				)
			})
	})

	test('new tutorial requires a login', () => {
		expect.assertions(5)
		mockCurrentUser = { id: 99, canCreateDrafts: false } // mock current logged in user
		return request(app)
			.post('/api/drafts/tutorial')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('new draft 500s when createWithContent fails', () => {
		expect.assertions(5)
		DraftModel.createWithContent.mockRejectedValueOnce()
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/tutorial')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
			})
	})

	// update draft

	test('updating a draft with xml returns successfully', () => {
		expect.assertions(5)
		xml.mockReturnValueOnce({})
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		DraftModel.findDuplicateIds.mockReturnValueOnce(null) // no errors
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('text/plain')
			.accept('text/plain')
			.send(basicXML)
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', {
					id: 'mockUpdatedContentId'
				})
				expect(xml).toHaveBeenCalledWith(basicXML, true)
			})
	})

	test('updating a draft with json returns successfully', () => {
		expect.assertions(3)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		DraftModel.findDuplicateIds.mockReturnValueOnce(null) // no errors
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('application/json')
			.send('{"test":true}')
			.then(response => {
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', {
					id: 'mockUpdatedContentId'
				})
			})
	})

	test('updating a draft errors when xmlToDraftObject returns invalid object', () => {
		expect.assertions(6)
		xml.mockImplementationOnce(null)
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('text/plain')
			.accept('text/plain')
			.send(basicXML)
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(422)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'badInput')
				expect(response.body.value).toHaveProperty(
					'message',
					'Posting draft failed - format unexpected'
				)
			})
	})

	test('updating a draft errors when xmlToDraftObject throws error', () => {
		expect.assertions(6)
		xml.mockImplementationOnce(() => {
			throw 'some-error'
		})
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('text/plain')
			.accept('text/plain')
			.send(basicXML)
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(422)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'badInput')
				expect(response.body.value).toHaveProperty(
					'message',
					'Posting draft failed - format unexpected'
				)
			})
	})

	test('updating a draft requires canCreateDrafts', () => {
		expect.assertions(5)
		mockCurrentUser = { id: 99, canCreateDrafts: false } // mock current logged in user
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('text/plain')
			.accept('text/plain')
			.send(basicXML)
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('update draft detects duplicate ids', () => {
		expect.assertions(5)
		xml.mockReturnValueOnce({})
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		DraftModel.findDuplicateIds.mockReturnValueOnce('duplicate-id') // mock the findDuplicateIds method
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('text/plain')
			.accept('text/plain')
			.send(basicXML)
			.then(response => {
				expect(response.statusCode).toBe(422)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'badInput')
				expect(response.body.value).toHaveProperty(
					'message',
					'Posting draft failed - duplicate id "duplicate-id"'
				)
			})
	})

	test('updating 500s when findDuplicateIds errors', () => {
		expect.assertions(5)
		xml.mockReturnValueOnce({})
		mockCurrentUser = { id: 99, canCreateDrafts: true } // mock current logged in user
		DraftModel.findDuplicateIds.mockImplementationOnce(() => {
			throw 'oh no'
		}) // mock the findDuplicateIds method
		return request(app)
			.post('/api/drafts/00000000-0000-0000-0000-000000000000')
			.type('text/plain')
			.accept('text/plain')
			.send(basicXML)
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
			})
	})

	// delete draft

	test('delete errors with permissions before draftID validation', () => {
		expect.assertions(4)
		mockCurrentUser = { id: 99, canDeleteDrafts: false }
		return request(app)
			.delete('/api/drafts/6')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value', {
					type: 'notAuthorized'
				})
			})
	})

	test('delete rejects draft ids that arent UUIDs', () => {
		expect.assertions(6)
		mockCurrentUser = { id: 99, canDeleteDrafts: true }
		return request(app)
			.delete('/api/drafts/6')
			.type('application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(422)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'badInput')
				expect(response.body.value).toHaveProperty('message', 'draftId must be a valid UUID, got 6')
			})
	})

	test('delete draft returns successfully', () => {
		expect.assertions(4)
		DraftModel.deleteByIdAndUser.mockResolvedValueOnce('mock-db-result')
		mockCurrentUser = { id: 99, canDeleteDrafts: true } // mock current logged in user
		return request(app)
			.delete('/api/drafts/00000000-0000-0000-0000-000000000000')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(200)
				expect(response.body).toHaveProperty('status', 'ok')
				expect(response.body).toHaveProperty('value', 'mock-db-result')
			})
	})

	test('delete 500s when the database errors', () => {
		expect.assertions(5)
		DraftModel.deleteByIdAndUser.mockRejectedValueOnce('oh no')
		mockCurrentUser = { id: 99, canDeleteDrafts: true } // mock current logged in user
		return request(app)
			.delete('/api/drafts/00000000-0000-0000-0000-000000000000')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(500)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'unexpected')
			})
	})

	test('delete 401s when a user tries deleting a draft they do not own', () => {
		expect.assertions(5)

		DraftPermissions.userHasPermissionToDraft.mockResolvedValueOnce(false)
		mockCurrentUser = { id: 99, canDeleteDrafts: true } // mock current logged in user

		return request(app)
			.delete('/api/drafts/00000000-0000-0000-0000-000000000000')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
				expect(response.body.value).toHaveProperty(
					'message',
					'You must be the author of this draft to delete it'
				)
			})
	})
})
