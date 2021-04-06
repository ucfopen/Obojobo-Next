let mockArgs // array of mocked express middleware request arguments
const userFunctions = ['getCurrentVisitFromRequest']

jest.mock('test_node')
jest.mock('../server/models/visit')

const MockVisitModel = oboRequire('server/models/visit')

describe('current visit middleware', () => {
	beforeAll(() => {})
	afterAll(() => {})
	beforeEach(() => {
		mockArgs = (() => {
			const res = {}
			const req = {
				session: {},
				requireCurrentUser: jest.fn(),
				currentUser: {
					id: 'mock-user-id'
				}
			}
			const mockJson = jest.fn().mockImplementation(() => {
				return true
			})
			const mockStatus = jest.fn().mockImplementation(() => {
				return { json: mockJson }
			})
			const mockNext = jest.fn()
			res.status = mockStatus

			oboRequire('server/express_current_visit')(req, res, mockNext)
			return { res, req, mockJson, mockStatus, mockNext }
		})()
	})
	afterEach(() => {
		const { mockJson, mockStatus, mockNext } = mockArgs
		mockNext.mockClear()
		mockStatus.mockClear()
		mockJson.mockClear()
	})

	test('calls next', () => {
		const { mockNext } = mockArgs
		expect(mockNext).toBeCalledWith()
	})

	test('sets the expected properties on req', () => {
		expect.assertions(userFunctions.length * 2)

		const { req } = mockArgs

		userFunctions.forEach(func => {
			expect(req).toHaveProperty(func)
			expect(req[func]).toBeInstanceOf(Function)
		})
	})

	test('getCurrentVisitFromRequest resolves if already loaded', () => {
		const { req } = mockArgs
		req.currentVisit = {}
		return req.getCurrentVisitFromRequest().then(result => {
			expect(result).toBeUndefined()
			expect(MockVisitModel.fetchById).not.toHaveBeenCalled()
		})
	})

	test('getCurrentVisitFromRequest finds visitId in body, loads from db, and resolves', () => {
		const { req } = mockArgs
		req.body = {
			visitId: 'mock-visit-id-8'
		}
		MockVisitModel.fetchById.mockResolvedValueOnce(new MockVisitModel({ user_id: 'mock-user-id' }))

		return req.getCurrentVisitFromRequest().then(result => {
			expect(result).toBeUndefined()
			expect(req.currentVisit).toBeInstanceOf(MockVisitModel)
			expect(MockVisitModel.fetchById).toHaveBeenCalledWith('mock-visit-id-8')
		})
	})

	test('getCurrentVisitFromRequest finds visitId in params, loads from db, and resolves', () => {
		const { req } = mockArgs
		req.params = {
			visitId: 'mock-visit-id-8'
		}
		MockVisitModel.fetchById.mockResolvedValueOnce(new MockVisitModel({ user_id: 'mock-user-id' }))

		return req.getCurrentVisitFromRequest().then(result => {
			expect(result).toBeUndefined()
			expect(req.currentVisit).toBeInstanceOf(MockVisitModel)
			expect(MockVisitModel.fetchById).toHaveBeenCalledWith('mock-visit-id-8')
		})
	})
	test('getCurrentVisitFromRequest finds visitId in query, loads from db, and resolves', () => {
		const { req } = mockArgs
		req.params = {}
		req.query = {
			visitId: 'mock-visit-id-8'
		}
		MockVisitModel.fetchById.mockResolvedValueOnce(new MockVisitModel({ user_id: 'mock-user-id' }))

		return req.getCurrentVisitFromRequest().then(result => {
			expect(result).toBeUndefined()
			expect(req.currentVisit).toBeInstanceOf(MockVisitModel)
			expect(MockVisitModel.fetchById).toHaveBeenCalledWith('mock-visit-id-8')
		})
	})

	test('getCurrentVisitFromRequest finds visitId in body event, loads from db, and resolves', () => {
		const { req } = mockArgs
		req.body = {
			event: {
				visitId: 'mock-visit-id-9'
			}
		}
		MockVisitModel.fetchById.mockResolvedValueOnce(new MockVisitModel({ user_id: 'mock-user-id' }))

		return req.getCurrentVisitFromRequest().then(result => {
			expect(result).toBeUndefined()
			expect(req.currentVisit).toBeInstanceOf(MockVisitModel)
			expect(MockVisitModel.fetchById).toHaveBeenCalledWith('mock-visit-id-9')
		})
	})

	test('getCurrentVisitFromRequest rejects when visitId is not in req', () => {
		const { req } = mockArgs
		req.params = {}
		req.query = {}

		return req.getCurrentVisitFromRequest().catch(error => {
			expect(error).toBeInstanceOf(Error)
			expect(error.message).toContain('Missing required Visit Id')
		})
	})

	test('getCurrentVisitFromRequest rejects when visitId does not belong to current user', () => {
		const { req } = mockArgs
		req.body = {
			event: {
				visitId: 'mock-visit-id-9'
			}
		}
		MockVisitModel.fetchById.mockResolvedValueOnce(
			new MockVisitModel({ user_id: 'different-mock-user-id' })
		)

		return expect(req.getCurrentVisitFromRequest).rejects.toThrow(
			"Visit mock-visit-id-9 doesn't belong to current user mock-user-id"
		)
	})
})
