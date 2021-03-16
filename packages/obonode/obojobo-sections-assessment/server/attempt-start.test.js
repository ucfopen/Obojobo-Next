// Global for loading specialized Obojobo stuff
// use oboRequire('server/models/draft') to load draft models from any context
global.oboRequire = name => {
	return require(`obojobo-express/${name}`)
}

jest.mock('obojobo-express/server/logger')
jest.mock('obojobo-express/server/insert_event')
jest.mock('obojobo-express/server/db')
jest.mock('obojobo-express/server/models/draft')
jest.mock('obojobo-express/server/routes/api/events/create_caliper_event')
jest.mock('obojobo-document-engine/src/scripts/common/util/shuffle')
jest.mock('./models/assessment')

jest.mock(
	'obojobo-express/server/models/visit',
	() => ({
		fetchById: jest.fn()
	}),
	{ virtual: true }
)

jest.mock(
	'./util',
	() => ({
		getFullQuestionsFromDraftTree: jest.fn(),
		getRandom: jest.fn().mockReturnValue(0),
		logAndRespondToUnexpected: jest.fn()
	}),
	{ virtual: false }
)

const { getRandom, logAndRespondToUnexpected, getFullQuestionsFromDraftTree } = require('./util')

const {
	startAttempt,
	createAssessmentUsedQuestionMap,
	initAssessmentUsedQuestions,
	getSendToClientPromises,
	insertAttemptStartCaliperEvent,
	getState,
	loadChildren
} = require('./attempt-start.js')

const testJson = require('obojobo-document-engine/test-object.json')
const insertEvent = require('obojobo-express/server/insert_event')
const Draft = require('obojobo-express/server/models/draft')
const createCaliperEvent = require('obojobo-express/server/routes/api/events/create_caliper_event')
const AssessmentModel = require('./models/assessment')
const shuffle = require('obojobo-document-engine/src/scripts/common/util/shuffle')

const QUESTION_NODE_TYPE = 'ObojoboDraft.Chunks.Question'
const QUESTION_BANK_NODE_TYPE = 'ObojoboDraft.Chunks.QuestionBank'
const ERROR_ATTEMPT_LIMIT_REACHED = 'Attempt limit reached'
const ERROR_UNEXPECTED_DB_ERROR = 'Unexpected DB error'
const ERROR_IMPORT_USED = 'Import score has already been used'
const ERROR_ASSESSMENT_ID_NOT_FOUND = 'ID not found'

describe('start attempt route', () => {
	let mockDraft
	let mockUsedQuestionMap
	let mockReq
	let mockRes

	beforeEach(() => {
		jest.clearAllMocks()
		jest.restoreAllMocks()
		getRandom.mockReturnValue(0)

		// mock _.shuffle by always returning the same array
		// just check to make sure shuffle.toHaveBeenCalled
		shuffle.mockImplementation(arr => arr)
		mockDraft = new Draft(testJson)
		mockUsedQuestionMap = new Map()

		mockUsedQuestionMap.set('qb1', 0)
		mockUsedQuestionMap.set('qb1.q1', 0)
		mockUsedQuestionMap.set('qb1.q2', 0)
		mockUsedQuestionMap.set('qb2', 0)
		mockUsedQuestionMap.set('qb2.q1', 0)
		mockUsedQuestionMap.set('qb2.q2', 0)

		mockReq = {}
		mockRes = {}
	})

	test('startAttempt calls database, inserts events, adds assessment questions to response, and returns expected object', () => {
		mockRes = {
			success: jest.fn(),
			reject: jest.fn()
		}

		const mockAssessmentNode = {
			getChildNodeById: jest.fn(() => ({
				node: {
					content: {
						attempts: 3
					}
				},
				children: [
					{},
					{
						childrenSet: [],
						buildAssessment: jest.fn().mockReturnValueOnce([
							{
								id: 'mockQuestion',
								type: QUESTION_NODE_TYPE
							}
						])
					}
				],
				draftTree: {
					getChildNodeById: jest.fn().mockReturnValueOnce({
						id: 'mockQuestion',
						type: QUESTION_NODE_TYPE,
						children: [],
						yell: jest.fn(),
						toObject: jest.fn().mockReturnValueOnce({})
					})
				}
			}))
		}

		mockReq = {
			body: {
				draftId: 'mockDraftId',
				assessmentId: 'mockAssessmentId'
			},
			hostname: 'mockHostname',
			connection: {
				remoteAddress: 'mockRemoteAddress'
			},
			currentVisit: { is_preview: false },
			currentDocument: mockAssessmentNode,
			currentUser: { id: 4 }
		}

		const mockAttempt = {
			attemptId: 'mockAttemptId',
			state: {
				chosen: [
					{
						id: 'mockQuestion',
						type: QUESTION_NODE_TYPE
					},
					{
						id: 'mockQuestionBank',
						type: QUESTION_BANK_NODE_TYPE
					}
				]
			}
		}

		AssessmentModel.getCompletedAssessmentAttemptHistory.mockResolvedValueOnce([])
		AssessmentModel.createNewAttempt.mockResolvedValueOnce(mockAttempt)

		insertEvent.mockReturnValueOnce('mockInsertResult')
		createCaliperEvent.mockReturnValueOnce({
			createAssessmentAttemptStartedEvent: jest.fn().mockReturnValue('mockCaliperPayload')
		})

		expect.hasAssertions()
		return startAttempt(mockReq, mockRes).then(() => {
			expect(mockRes.success).toBeCalledTimes(1)
			expect(AssessmentModel.getCompletedAssessmentAttemptHistory).toHaveBeenCalled()
			expect(AssessmentModel.createNewAttempt).toHaveBeenCalled()
			expect(getFullQuestionsFromDraftTree).toHaveBeenCalledTimes(1)
		})
	})

	test('startAttempt rejects with an expected error when no attempts remain', () => {
		mockRes = { reject: jest.fn() }

		const mockAssessmentNode = {
			getChildNodeById: jest.fn(() => ({
				node: {
					content: {
						// Number of attempts the user is allowed (what we're testing here).
						attempts: 1
					}
				},
				children: [
					{},
					{
						childrenSet: ['test', 'test1'],
						toObject: jest.fn()
					}
				]
			}))
		}

		mockReq = {
			body: {
				draftId: 'mockDraftId',
				assessmentId: 'mockAssessmentId'
			},
			currentVisit: { is_preview: false },
			currentDocument: mockAssessmentNode,
			currentUser: { id: 4 }
		}

		AssessmentModel.getCompletedAssessmentAttemptHistory.mockResolvedValueOnce(['oneAttempt'])

		expect.hasAssertions()
		return startAttempt(mockReq, mockRes).then(() => {
			expect(mockRes.reject).toHaveBeenCalledWith(ERROR_ATTEMPT_LIMIT_REACHED)
		})
	})

	test('startAttempt rejects with an expected error when an import was used', () => {
		mockRes = { reject: jest.fn() }

		const mockAssessmentNode = {
			getChildNodeById: jest.fn(() => ({
				node: {
					content: {
						// Number of attempts the user is allowed (needs more then tthe number of attempts that are sent).
						attempts: 10
					}
				},
				children: [
					{},
					{
						childrenSet: ['test', 'test1'],
						toObject: jest.fn()
					}
				]
			}))
		}

		mockReq = {
			body: {
				draftId: 'mockDraftId',
				assessmentId: 'mockAssessmentId'
			},
			currentVisit: { is_preview: false },
			currentDocument: mockAssessmentNode,
			currentUser: { id: 4 }
		}

		AssessmentModel.getCompletedAssessmentAttemptHistory.mockResolvedValueOnce([
			{ isImported: false },
			{ isImported: true }
		])

		expect.hasAssertions()
		return startAttempt(mockReq, mockRes).then(() => {
			expect(mockRes.reject).toHaveBeenCalledWith(ERROR_IMPORT_USED)
		})
	})

	test('startAttempt rejects with an invalid assessment ID', () => {
		mockReq = {
			body: {
				assessmentId: 'badMockId'
			},
			currentVisit: { is_preview: false },
			currentDocument: {
				getChildNodeById: jest.fn(() => null)
			},
			currentUser: { id: 4 }
		}

		mockRes = { reject: jest.fn() }

		expect.hasAssertions()
		return startAttempt(mockReq, mockRes).then(() => {
			expect(mockRes.reject).toHaveBeenCalledWith(ERROR_ASSESSMENT_ID_NOT_FOUND)
		})
	})

	test('startAttempt calls logAndRespondToUnexpected with unexpected error', done => {
		mockReq = {
			requireCurrentDocument: jest.fn(() => {
				throw new Error(ERROR_UNEXPECTED_DB_ERROR)
			}),
			requireCurrentUser: jest.fn(() =>
				Promise.resolve({
					user: {}
				})
			)
		}

		mockRes = { unexpected: jest.fn() }

		startAttempt(mockReq, mockRes).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalled()
			done()
		})
	})

	test('createAssessmentUsedQuestionMap initializes a map of questions', () => {
		const mockAssessmentProperties = {
			nodeChildrenIds: ['qb1', 'qb1.q1', 'qb1.q2', 'qb2', 'qb2.q1', 'qb2.q2'],
			draftTree: mockDraft
		}

		// mock child lookup
		mockDraft.getChildNodeById.mockReturnValue({ node: { type: 'ObojoboDraft.Chunks.Question' } })
		mockDraft.getChildNodeById.mockReturnValueOnce({
			node: { type: QUESTION_BANK_NODE_TYPE }
		})
		mockDraft.getChildNodeById.mockReturnValueOnce({ node: { type: 'none' } })

		const usedQuestionMap = createAssessmentUsedQuestionMap(mockAssessmentProperties)

		expect(usedQuestionMap.constructor).toBe(Map)
		expect(usedQuestionMap.size).toBe(5)
		expect(usedQuestionMap.get('qb1')).toBe(0)
		expect(usedQuestionMap.get('qb1.q2')).toBe(0)
		expect(usedQuestionMap.get('qb2')).toBe(0)
		expect(usedQuestionMap.get('qb2.q1')).toBe(0)
		expect(usedQuestionMap.get('qb2.q2')).toBe(0)
	})

	// test('initAssessmentUsedQuestions tracks question use from initalized map', () => {
	// 	const fakeChildNodes = [
	// 		{
	// 			id: 'qb1.q1',
	// 			children: []
	// 		},
	// 		{
	// 			id: 'qb1.q2',
	// 			children: []
	// 		},
	// 		{
	// 			id: 'mockId',
	// 			children: []
	// 		}
	// 	]
	// 	const mockQbTree = { id: 'qb1', children: fakeChildNodes }

	// 	initAssessmentUsedQuestions(mockQbTree, mockUsedQuestionMap)

	// 	expect(mockUsedQuestionMap.get('qb1')).toBe(1)
	// 	expect(mockUsedQuestionMap.get('qb1.q1')).toBe(1)
	// 	expect(mockUsedQuestionMap.get('qb1.q2')).toBe(1)
	// 	expect(mockUsedQuestionMap.get('qb2')).toBe(0)
	// 	expect(mockUsedQuestionMap.get('qb2.q1')).toBe(0)
	// 	expect(mockUsedQuestionMap.get('qb2.q2')).toBe(0)
	// })

	test('createAssessmentUsedQuestionMap can initialize a map to track use of assessment questions', () => {
		const mockAssessmentProperties = {
			nodeChildrenIds: ['qb1', 'qb1.q1', 'qb1.q2', 'qb2', 'qb2.q1', 'qb2.q2'],
			draftTree: mockDraft
		}

		// mock child lookup
		mockDraft.getChildNodeById.mockReturnValue({ node: { type: 'ObojoboDraft.Chunks.Question' } })

		const usedQuestionMap = createAssessmentUsedQuestionMap(mockAssessmentProperties)

		expect(usedQuestionMap.constructor).toBe(Map)
		expect(usedQuestionMap.size).toBe(6)
		expect(usedQuestionMap.get('qb1')).toBe(0)
		expect(usedQuestionMap.get('qb1.q1')).toBe(0)
		expect(usedQuestionMap.get('qb1.q2')).toBe(0)
		expect(usedQuestionMap.get('qb2')).toBe(0)
		expect(usedQuestionMap.get('qb2.q1')).toBe(0)
		expect(usedQuestionMap.get('qb2.q2')).toBe(0)
	})

	test('initAssessmentUsedQuestions can track use of assessment questions using an initialized question map', () => {
		const chosenAssessment = [
			{ id: 'qb1.q1', type: QUESTION_NODE_TYPE },
			{ id: 'qb1.q2', type: QUESTION_NODE_TYPE },
			{ id: 'mock-id', type: QUESTION_NODE_TYPE },
			{ id: 'qb1', type: QUESTION_BANK_NODE_TYPE }
		]

		initAssessmentUsedQuestions(chosenAssessment, mockUsedQuestionMap)

		expect(mockUsedQuestionMap.get('qb1')).toBe(1)
		expect(mockUsedQuestionMap.get('qb1.q1')).toBe(1)
		expect(mockUsedQuestionMap.get('qb1.q2')).toBe(1)
		expect(mockUsedQuestionMap.get('qb2')).toBe(0)
		expect(mockUsedQuestionMap.get('qb2.q1')).toBe(0)
		expect(mockUsedQuestionMap.get('qb2.q2')).toBe(0)
	})

	// test('can retrieve an array of question type nodes from a node tree', () => {
	// 	let n = 0
	// 	const newQ = () => {
	// 		const q = new DraftNode()
	// 		q.id = n++
	// 		q.type = 'ObojoboDraft.Chunks.Question'
	// 		return q
	// 	}

	// 	const node = new DraftNode({ getChildNodeById: jest.fn(id => `q${id}`) })
	// 	const q1 = newQ()
	// 	const q2 = newQ()
	// 	const q3 = newQ()
	// 	const q4 = newQ()
	// 	const q5 = newQ()
	// 	const q6 = newQ()
	// 	node.children = [q1, q5]
	// 	q1.children = [q2, q3]
	// 	q2.children = [q4, q6]
	// 	q6.type = 'not-a-question'

	// 	const questions = getNodeQuestions(node, node)

	// 	expect(questions).toHaveLength(5)
	// 	expect(questions).toEqual(['q0', 'q1', 'q3', 'q2', 'q4'])
	// })

	test('getSendToClientPromises calls and returns array of yell results from all questions', () => {
		const attemptState = { chosen: [] }

		const mockAssessmentNode = {
			draftTree: {
				getChildNodeById: jest.fn(() => ({ yell: mockYell }))
			}
		}

		expect(getSendToClientPromises(mockAssessmentNode, attemptState, {}, {})).toEqual([])

		let n = 0
		const mockYell = jest.fn(() => n++)
		attemptState.chosen = [
			{ id: 'mockId1', type: 'mockType1' },
			{ id: 'mockId2', type: 'mockType2' }
		]

		const result = getSendToClientPromises(mockAssessmentNode, attemptState, 'mockReq', 'mockRes')
		// yell is called?
		expect(mockYell).toHaveBeenCalledTimes(2)
		expect(mockYell).toHaveBeenCalledWith(
			'ObojoboDraft.Sections.Assessment:sendToAssessment',
			'mockReq',
			'mockRes'
		)

		// returns from yell come back?
		expect(result).toEqual([0, 1])
	})

	test('insertAttemptStartCaliperEvent inserts a new attempt, creates events and replies with an expected object', () => {
		const createAssessmentAttemptStartedEvent = jest.fn().mockReturnValue('mockCaliperPayload')
		insertEvent.mockReturnValueOnce('mockInsertResult')
		createCaliperEvent.mockReturnValueOnce({
			createAssessmentAttemptStartedEvent
		})
		Date.prototype.toISOString = () => 'date' //eslint-disable-line

		const mockDraft = {
			draftId: 'mockDraftId',
			contentId: 'mockContentId'
		}

		const r = insertAttemptStartCaliperEvent(
			'mockAttemptId',
			1,
			'mockUserId',
			mockDraft,
			'mockAssessmentId',
			true,
			'mockHostname',
			'mockRemoteAddress'
		)

		expect(r).toBe('mockInsertResult')

		// Make sure insertEvent was called
		expect(insertEvent).toHaveBeenCalledTimes(1)

		expect(createAssessmentAttemptStartedEvent).toHaveBeenCalledWith({
			actor: {
				id: 'mockUserId',
				type: 'user'
			},
			assessmentId: 'mockAssessmentId',
			attemptId: 'mockAttemptId',
			draftId: 'mockDraftId',
			contentId: 'mockContentId',
			extensions: {
				count: 1
			}
		})

		expect(insertEvent).toHaveBeenCalledWith({
			action: 'assessment:attemptStart',
			actorTime: 'date',
			caliperPayload: 'mockCaliperPayload',
			draftId: 'mockDraftId',
			contentId: 'mockContentId',
			eventVersion: '1.1.0',
			ip: 'mockRemoteAddress',
			metadata: {},
			isPreview: true,
			payload: {
				attemptCount: 1,
				attemptId: 'mockAttemptId'
			},
			userId: 'mockUserId'
		})
	})

	test('loadChildren builds a full map of used questions', () => {
		const mockChosenQuestions = [
			{ id: 'qb1.q1', type: QUESTION_NODE_TYPE },
			{ id: 'qb1.q2', type: QUESTION_NODE_TYPE },
			{ id: 'qb1', type: QUESTION_BANK_NODE_TYPE }
		]
		const mockAssessmentProperties = {
			nodeChildrenIds: ['qb1', 'qb1.q1', 'qb1.q2', 'qb2', 'qb2.q1', 'qb2.q2'],
			draftTree: mockDraft,
			attemptHistory: [
				{
					state: {
						chosen: mockChosenQuestions
					}
				}
			]
		}
		// mock child lookup
		mockDraft.getChildNodeById.mockReturnValue({ node: { type: 'ObojoboDraft.Chunks.Question' } })

		const map = loadChildren(mockAssessmentProperties)

		expect(map.get('qb1')).toBe(1)
		expect(map.get('qb1.q1')).toBe(1)
		expect(map.get('qb1.q2')).toBe(1)
		expect(map.get('qb2')).toBe(0)
		expect(map.get('qb2.q1')).toBe(0)
		expect(map.get('qb2.q2')).toBe(0)
	})

	test('loadChildren does not alter the map when an attempt does not have a qb', () => {
		const mockAssessmentProperties = {
			nodeChildrenIds: ['qb1', 'qb1.q1', 'qb1.q2', 'qb2', 'qb2.q1', 'qb2.q2'],
			draftTree: mockDraft,
			attemptHistory: [
				{
					state: {}
				}
			]
		}
		// mock child lookup
		mockDraft.getChildNodeById.mockReturnValue({ node: { type: 'ObojoboDraft.Chunks.Question' } })

		const map = loadChildren(mockAssessmentProperties)

		expect(map.get('qb1')).toBe(0)
		expect(map.get('qb1.q1')).toBe(0)
		expect(map.get('qb1.q2')).toBe(0)
		expect(map.get('qb2')).toBe(0)
		expect(map.get('qb2.q1')).toBe(0)
		expect(map.get('qb2.q2')).toBe(0)
	})

	test('getState calls qb.buildAssessment and returns the expected state', () => {
		const mockBuildAssessment = jest.fn(() => [
			{ id: 'qb1.q1', type: QUESTION_NODE_TYPE },
			{ id: 'qb1', type: QUESTION_BANK_NODE_TYPE }
		])
		const mockAssessmentProperties = {
			nodeChildrenIds: ['qb1', 'qb1.q1', 'qb1.q2', 'qb2', 'qb2.q1', 'qb2.q2'],
			draftTree: mockDraft,
			attemptHistory: [
				{
					state: {
						chosen: [
							{ id: 'qb1.q1', type: QUESTION_NODE_TYPE },
							{ id: 'qb1', type: QUESTION_BANK_NODE_TYPE }
						]
					}
				}
			],
			questionBank: {
				buildAssessment: mockBuildAssessment
			},
			oboNode: {
				draftTree: mockDraft
			}
		}
		// mock child lookup
		mockDraft.getChildNodeById.mockImplementation(id => {
			return {
				node: {
					id: id,
					type: 'ObojoboDraft.Chunks.Question'
				}
			}
		})

		const state = getState(mockAssessmentProperties)

		expect(state.chosen).toEqual([
			{ id: 'qb1.q1', type: 'ObojoboDraft.Chunks.Question' },
			{ id: 'qb1', type: QUESTION_BANK_NODE_TYPE }
		])
	})
})
