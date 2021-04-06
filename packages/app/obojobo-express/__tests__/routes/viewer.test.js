jest.mock('../../server/models/visit')
jest.mock('../../server/insert_event')
jest.mock('../../server/obo_events')
jest.mock(
	'../../server/asset_resolver',
	() => ({
		assetForEnv: path => path,
		webpackAssetPath: path => path
	}),
	{ virtual: true }
)
// make sure all Date objects use a static date
mockStaticDate()

jest.mock('../../server/db')
jest.unmock('fs') // need fs working for view rendering
jest.unmock('express') // we'll use supertest + express for this

// override requireCurrentUser to provide our own
let mockCurrentUser
let mockCurrentVisit
let mockSaveSessionSuccess = true
jest.mock('../../server/express_current_user', () => (req, res, next) => {
	req.requireCurrentUser = () => {
		req.currentUser = mockCurrentUser
		return Promise.resolve(mockCurrentUser)
	}
	req.saveSessionPromise = () => {
		if (mockSaveSessionSuccess) return Promise.resolve()
		return Promise.reject()
	}
	req.getCurrentVisitFromRequest = () => {
		req.currentVisit = mockCurrentVisit
		return Promise.resolve()
	}
	next()
})

// ovveride requireCurrentDocument to provide our own
let mockCurrentDocument
jest.mock('../../server/express_current_document', () => (req, res, next) => {
	req.requireCurrentDocument = () => {
		if (!mockCurrentDocument) return Promise.reject()
		req.currentDocument = mockCurrentDocument
		return Promise.resolve(mockCurrentDocument)
	}
	res.render = jest
		.fn()
		.mockImplementation((template, message) =>
			res.send(`mock template rendered: ${template} with message: ${message}`)
		)
	next()
})

// ovveride requireCurrentDocument to provide our own
let mockLtiLaunch
jest.mock('../../server/express_lti_launch', () => ({
	assignment: (req, res, next) => {
		req.lti = { body: mockLtiLaunch }
		req.oboLti = {
			launchId: 'mock-launch-id',
			body: mockLtiLaunch
		}
		next()
	}
}))

// setup express server
const request = require('supertest')
const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.set('views', __dirname + '../../../server/views/')
app.use(oboRequire('server/express_current_user'))
app.use(oboRequire('server/express_current_document'))
app.use('/', oboRequire('server/express_response_decorator'))
app.use('/', oboRequire('server/routes/viewer'))

describe('viewer route', () => {
	const insertEvent = oboRequire('server/insert_event')
	const VisitModel = oboRequire('server/models/visit')
	const oboEvents = oboRequire('server/obo_events')

	beforeAll(() => {})
	afterAll(() => {})
	beforeEach(() => {
		mockCurrentVisit = { is_preview: false }
		mockCurrentUser = { id: 4, canViewAsStudent: true }
		insertEvent.mockReset()
		VisitModel.createVisit.mockReset()
		VisitModel.fetchById.mockResolvedValue(mockCurrentVisit)
	})
	afterEach(() => {})

	test('launch visit requires current user in form requests', () => {
		expect.assertions(3)
		mockCurrentUser = null
		return request(app)
			.post(`/${validUUID()}/`)
			.type('application/x-www-form-urlencoded')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(401)
				expect(response.text).toBe('Not Authorized')
			})
	})

	test('launch visit requires current user in json requests', () => {
		expect.assertions(5)
		mockCurrentUser = null
		return request(app)
			.post(`/${validUUID()}/`)
			.type('application/json')
			.set('Accept', 'application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('launch visit requires a currentDocument', () => {
		expect.assertions(2)
		mockCurrentDocument = null

		return request(app)
			.post(`/${validUUID()}/`)
			.type('application/x-www-form-urlencoded')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(404)
			})
	})

	test('launch visit redirects to view for students', () => {
		expect.assertions(3)

		VisitModel.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		// mockCurrentUser = {id: 44}
		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/plain')
				expect(response.statusCode).toBe(302)
				expect(response.text).toBe(
					'Found. Redirecting to /view/' + validUUID() + '/visit/mocked-visit-id'
				)
			})
	})

	test('launch visit redirects to preview for non-students', () => {
		expect.assertions(3)
		mockCurrentUser.canViewAsStudent = false
		const uuid = validUUID()

		VisitModel.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		mockCurrentDocument = { draftId: uuid }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${uuid}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/plain')
				expect(response.statusCode).toBe(302)
				expect(response.text).toBe(`Found. Redirecting to /preview/${uuid}`)
			})
	})

	test('launch visit inserts event `visit:create`', () => {
		expect.assertions(4)
		VisitModel.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/plain')
				expect(response.statusCode).toBe(302)
				expect(insertEvent).toHaveBeenCalledTimes(1)
				expect(insertEvent.mock.calls[0]).toMatchSnapshot()
			})
	})

	test('launch visit allows EVENT_BEFORE_NEW_VISIT to alter req', () => {
		expect.assertions(4)
		VisitModel.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		// use event listener to alter req
		oboEvents.emit.mockImplementation((event, options) => {
			options.req.visitOptions = {}
		})

		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/plain')
				expect(response.statusCode).toBe(302)
				expect(insertEvent).toHaveBeenCalledTimes(1)
				expect(insertEvent.mock.calls[0]).toMatchSnapshot()
			})
	})

	test('launch visit doesnt redirect with session errors', () => {
		expect.assertions(3)

		mockSaveSessionSuccess = false

		VisitModel.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(VisitModel.createVisit).toHaveBeenCalledTimes(1)
				expect(response.statusCode).toBe(500)
			})
	})

	test('view visit requires a current user', () => {
		expect.assertions(3)
		mockCurrentUser = null

		return request(app)
			.get('/' + validUUID() + '/visit/3')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(401)
				expect(response.text).toBe('Not Authorized')
			})
	})

	test('view visit requires a current document', () => {
		expect.assertions(2)

		mockCurrentDocument = null
		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(404)
			})
	})

	test('view visit requires visitId be a UUID', () => {
		expect.assertions(3)
		mockCurrentDocument = { draftId: validUUID() }

		return request(app)
			.get('/' + validUUID() + '/visit/3')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(422)
				expect(response.text).toBe('Bad Input: visitId must be a valid UUID, got 3')
			})
	})

	test('view visit inserts viewer:open event', () => {
		expect.assertions(4)

		mockCurrentDocument = {
			draftId: validUUID(),
			getTitle: () => 'mock title',
			yell: jest.fn().mockResolvedValueOnce()
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(insertEvent).toHaveBeenCalledTimes(1)
				expect(insertEvent.mock.calls[0]).toMatchSnapshot()
			})
	})

	test('view visit renders viewer', () => {
		expect.assertions(3)
		mockCurrentDocument = {
			draftId: validUUID(),
			getTitle: () => 'mock title',
			yell: jest.fn().mockResolvedValueOnce(),
			root: {
				node: {
					content: {
						title: 'my-title'
					}
				}
			}
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toBe('mock template rendered: viewer with message: [object Object]')
			})
	})

	test('view 500s when yell rejects and displays error', () => {
		expect.assertions(3)
		mockCurrentDocument = {
			draftId: validUUID(),
			yell: jest.fn().mockRejectedValueOnce('some-error')
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(500)
				expect(response.text).toContain('some-error')
			})
	})

	test('view 500s when yell rejects and displays default error', () => {
		expect.assertions(3)
		mockCurrentDocument = {
			draftId: validUUID(),
			yell: jest.fn().mockRejectedValueOnce()
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(500)
				expect(response.text).toContain('Server Error')
			})
	})
})
