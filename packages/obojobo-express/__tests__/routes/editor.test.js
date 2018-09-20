jest.mock('../../db')
jest.unmock('fs') // need fs working for view rendering
jest.unmock('express') // we'll use supertest + express for this

// override requireCurrentUser for tests to provide our own user
let mockCurrentUser
jest.mock('../../express_current_user', () => (req, res, next) => {
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

const mockDbDraft = (id, name) => ({
	draftId: id,
	xml: `xml-${name}`,
	content: {
		content: {
			title: `${name}-mock-title`
		}
	},
	createdAt: new Date()
})

// setup express server
const db = oboRequire('db')
const request = require('supertest')
const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.set('views', __dirname + '../../../views/')
app.use(oboRequire('express_current_user'))
app.use('/', oboRequire('express_response_decorator'))
app.use('/', oboRequire('routes/editor'))

describe('editor route', () => {
	beforeEach(() => {
		db.any.mockReset()
		mockCurrentUser = { id: 99, canViewEditor: true } // should meet auth requirements
	})

	test('get editor rejects users without canViewEditor permission', () => {
		expect.assertions(3)

		// mock the list of drafts
		db.any.mockResolvedValueOnce([])
		mockCurrentUser.canViewEditor = false

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(401)
				expect(response.text).toContain('Not Authorized')
			})
	})

	test('get returns the expected response when logged in', () => {
		expect.assertions(3)

		// mock the list of drafts
		db.any.mockResolvedValueOnce([])

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('Obojobo Editor')
			})
	})

	test('get returns drafts sorted alphabetically', () => {
		expect.assertions(7)
		// mock the list of drafts in backwards order
		db.any.mockResolvedValueOnce([mockDbDraft(99, '1'), mockDbDraft(100, '2')])

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('1-mock-title')
				expect(response.text).toContain('2-mock-title')
				expect(response.text).toContain('data-id="99"')
				expect(response.text).toContain('data-id="100"')
				expect(response.text.indexOf('1-mock-title')).toBeLessThan(
					response.text.indexOf('2-mock-title')
				)
			})
	})

	test('get editor sets data-content for drafts with xml as expected', () => {
		expect.assertions(3)

		// mock the list of drafts with xml content
		db.any.mockResolvedValueOnce([mockDbDraft(99, '1')])

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('data-content="xml-1"')
			})
	})

	test('get editor sets data-content for drafts without xml as expected', () => {
		expect.assertions(4)

		// mock the list of drafts with no xml content
		db.any.mockResolvedValueOnce([mockDbDraft(99, '1')])

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('data-content="xml-1"')
				expect(response.text).toContain('<p class="title">1-mock-title</p>')
			})
	})

	test('get editor handles db error with default error string', () => {
		expect.assertions(3)

		// mock the list of drafts with no xml content
		db.any.mockRejectedValueOnce(null)

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(500)
				expect(response.text).toContain('Server Error')
			})
	})

	test('get editor handles db error with rejected string ', () => {
		expect.assertions(3)

		// mock the list of drafts with no xml content
		db.any.mockRejectedValueOnce('rejected error')

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(500)
				expect(response.text).toContain('rejected error')
			})
	})
})
