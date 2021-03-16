import mockConsole from 'jest-mock-console'
import React from 'react'
import {
	ERROR_INVALID_ATTEMPT_END,
	ERROR_INVALID_ATTEMPT_RESUME
} from 'obojobo-sections-assessment/server/error-constants.js'

jest.mock('../../../src/scripts/common/util/modal-util', () => ({
	show: jest.fn(),
	hide: jest.fn()
}))

jest.mock('../../../src/scripts/common/util/error-util', () => ({
	show: jest.fn(),
	errorResponse: jest.fn()
}))

// mock react components
jest.mock('obojobo-sections-assessment/components/dialogs/pre-attempt-import-score-dialog', () =>
	global.mockReactComponent(this, 'ImportDialog')
)
jest.mock('obojobo-sections-assessment/components/dialogs/results-dialog', () =>
	global.mockReactComponent(this, 'ResultsDialog')
)
jest.mock('obojobo-sections-assessment/components/dialogs/updated-module-dialog', () =>
	global.mockReactComponent(this, 'UpdatedModuleDialog')
)

jest.mock('../../../src/scripts/viewer/assessment/assessment-score-reporter')
jest.mock('../../../src/scripts/viewer/stores/nav-store')
jest.mock('../../../src/scripts/viewer/util/question-util')
jest.mock('../../../src/scripts/viewer/util/nav-util')
jest.mock('../../../src/scripts/viewer/util/viewer-api')
jest.mock('../../../src/scripts/viewer/util/assessment-api')
jest.mock('../../../src/scripts/viewer/util/assessment-util')
jest.mock('../../../src/scripts/viewer/assessment/assessment-score-reporter')
jest.mock('../../../src/scripts/viewer/util/focus-util')

describe('AssessmentStore', () => {
	let ImportDialog
	let ResultsDialog
	let UpdatedModuleDialog
	let restoreConsole
	let AssessmentStore
	let Dispatcher
	let OboModel
	let AssessmentUtil
	let QuestionStore
	let NavStore
	let FocusUtil
	let NavUtil
	let ViewerAPI
	let AssessmentAPI
	let ModalUtil
	let ErrorUtil
	let QuestionUtil
	let LTIResyncStates
	let AssessmentScoreReporter
	let Registry
	const getExampleAssessment = () => ({
		id: 'rootId',
		type: 'ObojoboDraft.Modules.Module',
		children: [
			{
				id: 'assessmentId',
				type: 'ObojoboDraft.Sections.Assessment',
				content: {},
				children: [
					{
						id: 'pageId',
						type: 'ObojoboDraft.Pages.Page'
					},
					{
						id: 'questionBankId',
						type: 'ObojoboDraft.Chunks.QuestionBank'
					}
				]
			}
		]
	})

	const mockStartAttemptResult = () => ({
		status: 'ok',
		value: {
			attemptId: 'attemptId',
			assessmentId: 'assessmentId',
			state: {
				chosen: [
					{
						id: 'q1',
						type: 'ObojoboDraft.Chunks.Question'
					},
					{
						id: 'q2',
						type: 'ObojoboDraft.Chunks.Question'
					},
					{
						id: 'qb',
						type: 'ObojoboDraft.Chunks.QuestionBank'
					}
				]
			},
			questions: [
				{
					id: 'q1',
					type: 'ObojoboDraft.Chunks.Question',
					children: [
						{
							id: 'r1',
							type: 'ObojoboDraft.Chunks.MCAssessment'
						}
					]
				},
				{
					id: 'q2',
					type: 'ObojoboDraft.Chunks.Question',
					children: [
						{
							id: 'r2',
							type: 'ObojoboDraft.Chunks.MCAssessment'
						}
					]
				}
			]
		}
	})

	beforeEach(done => {
		jest.resetModules()
		jest.resetAllMocks()
		jest.restoreAllMocks()
		restoreConsole = mockConsole('error')
		ImportDialog = require('obojobo-sections-assessment/components/dialogs/pre-attempt-import-score-dialog')
		ResultsDialog = require('obojobo-sections-assessment/components/dialogs/results-dialog')
		UpdatedModuleDialog = require('obojobo-sections-assessment/components/dialogs/updated-module-dialog')
		OboModel = require('../../../__mocks__/_obo-model-with-chunks').default
		AssessmentStore = require('../../../src/scripts/viewer/stores/assessment-store').default
		Dispatcher = require('../../../src/scripts/common/flux/dispatcher').default
		Registry = require('../../../src/scripts/common/registry').Registry
		AssessmentUtil = require('../../../src/scripts/viewer/util/assessment-util').default
		QuestionStore = require('../../../src/scripts/viewer/stores/question-store').default
		NavStore = require('../../../src/scripts/viewer/stores/nav-store').default
		FocusUtil = require('../../../src/scripts/viewer/util/focus-util').default
		NavUtil = require('../../../src/scripts/viewer/util/nav-util').default
		ViewerAPI = require('../../../src/scripts/viewer/util/viewer-api').default
		AssessmentAPI = require('../../../src/scripts/viewer/util/assessment-api').default
		ModalUtil = require('../../../src/scripts/common/util/modal-util')
		ErrorUtil = require('../../../src/scripts/common/util/error-util')
		QuestionUtil = require('../../../src/scripts/viewer/util/question-util').default
		LTIResyncStates = require('../../../src/scripts/viewer/stores/assessment-store/lti-resync-states')
			.default
		AssessmentScoreReporter = require('../../../src/scripts/viewer/assessment/assessment-score-reporter')
			.default
		ViewerAPI.getVisitSessionStatus.mockResolvedValue({ status: 'ok' })
		AssessmentStore.state = {} // reset state
		AssessmentStore.triggerChange = jest.fn()
		QuestionStore.init()
		QuestionStore.triggerChange = jest.fn()

		expect.hasAssertions()
		// Need to make sure all the Obo components are loaded
		Registry.getItems(() => {
			done()
		})
	})

	afterEach(() => {
		restoreConsole()
	})

	test('init builds default state', () => {
		AssessmentStore.init()

		expect(AssessmentStore.getState()).toMatchInlineSnapshot(`
		Object {
		  "assessmentSummary": Array [],
		  "assessments": Object {},
		  "attemptHistoryLoadState": "none",
		  "importHasBeenUsed": false,
		  "importableScore": null,
		  "isResumingAttempt": false,
		}
	`)
	})

	test('init shows dialog for unfinished attempt', () => {
		const displayUnfinished = jest.spyOn(AssessmentStore, 'displayUnfinishedAttemptNotice')
		const findUnfinished = jest.spyOn(AssessmentStore, 'findUnfinishedAttemptInAssessmentSummary')
		findUnfinished.mockReturnValue({ unfinishedAttemptId: 'mock-attempt-id' })

		AssessmentStore.init([])

		expect(AssessmentStore.getState()).toHaveProperty('isResumingAttempt', true)
		expect(displayUnfinished).toHaveBeenCalledTimes(1)
		expect(displayUnfinished).toHaveBeenCalledWith('mock-attempt-id')
	})

	test('init extracts & combines extensions for importableScore and assessmentSummary', () => {
		jest.spyOn(AssessmentStore, 'displayUnfinishedAttemptNotice')
		const findUnfinished = jest.spyOn(AssessmentStore, 'findUnfinishedAttemptInAssessmentSummary')
		//eslint-disable-next-line no-undefined
		findUnfinished.mockReturnValue(undefined)

		const extensions = [
			{
				name: 'ObojoboDraft.Sections.Assessment',
				importableScore: 'mock-importable-score',
				assessmentSummary: 'mock-summary'
			},
			{ name: 'ObojoboDraft.Sections.NotAssessment' }
		]

		AssessmentStore.init(extensions)

		expect(AssessmentStore.getState()).toHaveProperty('importableScore', 'mock-importable-score')
		expect(AssessmentStore.getState()).toHaveProperty('assessmentSummary', 'mock-summary')
	})

	test('init calls displayScoreImportNotice', () => {
		const displayImport = jest.spyOn(AssessmentStore, 'displayScoreImportNotice')
		const findUnfinished = jest.spyOn(AssessmentStore, 'findUnfinishedAttemptInAssessmentSummary')
		//eslint-disable-next-line no-undefined
		findUnfinished.mockReturnValue(undefined)

		const extensions = [
			{
				name: 'ObojoboDraft.Sections.Assessment',
				importableScore: 'mock-importable-score',
				assessmentSummary: 'mock-summary'
			},
			{ name: 'ObojoboDraft.Sections.NotAssessment' }
		]

		AssessmentStore.init(extensions)

		expect(displayImport).toHaveBeenCalledTimes(1)
	})

	test('init skips displayScoreImportNotice if theres no importableScore', () => {
		const displayImport = jest.spyOn(AssessmentStore, 'displayScoreImportNotice')
		const findUnfinished = jest.spyOn(AssessmentStore, 'findUnfinishedAttemptInAssessmentSummary')
		//eslint-disable-next-line no-undefined
		findUnfinished.mockReturnValue(undefined)

		const extensions = [
			{
				name: 'ObojoboDraft.Sections.Assessment',
				importableScore: null,
				assessmentSummary: 'mock-summary'
			},
			{ name: 'ObojoboDraft.Sections.NotAssessment' }
		]

		AssessmentStore.init(extensions)

		expect(displayImport).toHaveBeenCalledTimes(0)
	})

	test('findUnfinishedAttemptInAssessmentSummary finds expected attempts', () => {
		// store a ref to the function we're testing simply to reduce
		// the length of the tests here
		const fnToTest = AssessmentStore.findUnfinishedAttemptInAssessmentSummary

		/* eslint-disable no-undefined */
		expect(fnToTest([])).toBe(undefined)
		expect(fnToTest([{ somethingElse: true }])).toBe(undefined)
		expect(fnToTest([{ unfinishedAttemptId: null }])).toBe(undefined)
		expect(fnToTest([{ somethingElse: true }])).toBe(undefined)
		expect(fnToTest([{ unfinishedAttemptId: true }])).toBe(undefined)
		expect(fnToTest([{ unfinishedAttemptId: false }])).toBe(undefined)
		expect(fnToTest([{ unfinishedAttemptId: 44 }])).toBe(undefined)
		expect(fnToTest([{ unfinishedAttemptId: 'str' }])).toEqual({ unfinishedAttemptId: 'str' })
		/* eslint-enable no-undefined */
	})

	test('resuming an unfinished attempt hides the modal, starts the attempt and triggers a change', async () => {
		NavStore.getState.mockReturnValue({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		const mockResumeAttemptResponse = {
			status: 'ok',
			value: { mockValue: true }
		}

		AssessmentAPI.resumeAttempt.mockResolvedValueOnce(mockResumeAttemptResponse)
		jest.spyOn(AssessmentStore, 'updateStateAfterStartAttempt')
		AssessmentStore.updateStateAfterStartAttempt.mockReturnValueOnce()

		await AssessmentStore.resumeAttemptWithAPICall('resume-attempt-id')

		expect(ModalUtil.hide).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.updateStateAfterStartAttempt).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.updateStateAfterStartAttempt).toHaveBeenCalledWith(
			mockResumeAttemptResponse.value
		)
		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)

		AssessmentStore.updateStateAfterStartAttempt.mockRestore()
	})

	test('startAttemptWithAPICall shows an error if no attempts are left and triggers a change', () => {
		OboModel.create(getExampleAssessment())

		AssessmentAPI.startAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'Attempt limit reached'
			}
		})

		return AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId').then(
			() => {
				expect(ErrorUtil.show).toHaveBeenCalledTimes(1)
				expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
			}
		)
	})

	test('startAttemptWithAPICall shows an error if the assessment ID is invalid', () => {
		OboModel.create(getExampleAssessment())

		AssessmentAPI.startAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'ID not found'
			}
		})

		return AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId').then(
			() => {
				expect(ErrorUtil.show).toHaveBeenCalledTimes(1)
				expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
			}
		)
	})

	test('startAttemptWithAPICall shows a generic error if an unrecognized error is thrown and triggers a change', () => {
		OboModel.create(getExampleAssessment())

		AssessmentAPI.startAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'Some unexpected error that was not accounted for'
			}
		})

		return AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId').then(
			() => {
				expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
				expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
			}
		)
	})

	test('startAttemptWithAPICall rejects with unexpected errors', () => {
		OboModel.create(getExampleAssessment())

		// cause ErrorUtil.show to be called
		AssessmentAPI.startAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'attempt limit reached'
			}
		})

		// use this to throw an unexpected error
		ErrorUtil.show.mockImplementationOnce(() => {
			throw new Error('Unexpected Error')
		})

		return expect(
			AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId')
		).rejects.toThrow('Unexpected Error')
	})

	test('startAttemptWithAPICall injects question models, creates state, updates the nav and processes the onStartAttempt trigger', async () => {
		AssessmentAPI.startAttempt.mockResolvedValue(mockStartAttemptResult())
		OboModel.create(getExampleAssessment())

		NavUtil.rebuildMenu = jest.fn()
		NavUtil.goto = jest.fn()

		const assessmentModel = OboModel.models.rootId.children.at(0)
		const qBank = assessmentModel.children.at(1)

		assessmentModel.processTrigger = jest.fn()

		AssessmentStore.init([])
		await AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId')

		expect(assessmentModel.children.length).toBe(2)
		expect(qBank.children.length).toBe(2)
		expect(qBank.children.at(0).id).toBe('q1')
		expect(qBank.children.at(1).id).toBe('q2')
		expect(NavUtil.rebuildMenu).toHaveBeenCalledTimes(1)
		expect(NavUtil.goto).toHaveBeenCalledTimes(1)
		expect(NavUtil.goto).toHaveBeenCalledWith('assessmentId')
		expect(OboModel.models.assessmentId.processTrigger).toHaveBeenCalledWith('onStartAttempt')
		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
	})

	test('startAttemptWithAPICall builds an attempt if it doesnt exist', () => {
		AssessmentAPI.startAttempt.mockResolvedValue(mockStartAttemptResult())
		OboModel.create(getExampleAssessment())

		AssessmentStore.setState({ assessments: { assessmentId: {} } })

		NavUtil.rebuildMenu = jest.fn()
		NavUtil.goto = jest.fn()

		const assessmentModel = OboModel.models.rootId.children.at(0)
		const qBank = assessmentModel.children.at(1)

		assessmentModel.processTrigger = jest.fn()

		return AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId').then(
			() => {
				expect(assessmentModel.children.length).toBe(2)
				expect(qBank.children.length).toBe(2)
				expect(qBank.children.at(0).id).toBe('q1')
				expect(qBank.children.at(1).id).toBe('q2')
				expect(NavUtil.rebuildMenu).toHaveBeenCalledTimes(1)
				expect(NavUtil.goto).toHaveBeenCalledTimes(1)
				expect(NavUtil.goto).toHaveBeenCalledWith('assessmentId')
				expect(OboModel.models.assessmentId.processTrigger).toHaveBeenCalledWith('onStartAttempt')
				expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
			}
		)
	})

	test('tryResendLTIScore catches unexpected errors', () => {
		OboModel.create(getExampleAssessment())
		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		AssessmentUtil.getAssessmentForModel.mockReturnValueOnce({})
		AssessmentStore.setState({ assessments: { assessmentId: {} } })

		AssessmentAPI.resendLTIAssessmentScore.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'attempt limit reached'
			}
		})
		ErrorUtil.errorResponse.mockImplementationOnce(() => {
			throw new Error('Mock Error')
		})

		return AssessmentStore.tryResendLTIScore('assessmentId').then(() => {
			expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
			// eslint-disable-next-line no-console
			expect(console.error).toHaveBeenCalledWith(expect.any(Error))
		})
	})

	test('tryResendLTIScore returns with error', () => {
		expect.assertions(2)
		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		AssessmentAPI.startAttempt.mockResolvedValue(mockStartAttemptResult())
		OboModel.create(getExampleAssessment())

		AssessmentStore.setState({
			assessments: {
				assessmentId: {}
			}
		})

		AssessmentUtil.getAssessmentForModel.mockReturnValueOnce(
			AssessmentStore.getState().assessments.assessmentId
		)
		AssessmentAPI.resendLTIAssessmentScore.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'Some unexpected error that was not accounted for'
			}
		})

		return AssessmentStore.tryResendLTIScore('assessmentId').then(() => {
			expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
			expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
		})
	})

	test('tryResendLTIScore updates and triggersChange', () => {
		expect.assertions(2)
		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		AssessmentAPI.startAttempt.mockResolvedValue(mockStartAttemptResult())
		OboModel.create(getExampleAssessment())

		AssessmentStore.setState({
			assessments: {
				assessmentId: {}
			}
		})

		AssessmentUtil.getAssessmentForModel.mockReturnValueOnce(
			AssessmentStore.getState().assessments.assessmentId
		)
		AssessmentUtil.getAssessmentForModel.mockReturnValueOnce(
			AssessmentStore.getState().assessments.assessmentId
		)

		AssessmentAPI.resendLTIAssessmentScore.mockResolvedValueOnce({
			status: 'success',
			value: {}
		})

		return AssessmentStore.tryResendLTIScore('assessmentId').then(() => {
			expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(0)
			expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(3)
		})
	})

	test('updateLTIScore updates resyncState to failed if resync fails, updates lti object, calls triggerChange', () => {
		AssessmentUtil.isLTIScoreNeedingToBeResynced.mockReturnValueOnce(true)
		const assessment = {}

		AssessmentStore.updateLTIScore(assessment, 'mock-lti-response')

		expect(assessment).toEqual({
			ltiResyncState: LTIResyncStates.RESYNC_FAILED,
			lti: 'mock-lti-response'
		})
		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
	})

	test('updateLTIScore updates resyncState to success if resync works, updates lti object, calls triggerChange', () => {
		AssessmentUtil.isLTIScoreNeedingToBeResynced.mockReturnValueOnce(false)
		const assessment = {}

		AssessmentStore.updateLTIScore(assessment, 'mock-lti-response')

		expect(assessment).toEqual({
			ltiResyncState: LTIResyncStates.RESYNC_SUCCEEDED,
			lti: 'mock-lti-response'
		})
		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
	})

	test('endAttemptWithAPICall catches unexpected errors', () => {
		OboModel.create(getExampleAssessment())
		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		AssessmentStore.setState({
			assessments: { assessmentId: { current: { attemptId: 'mockAttemptId' } } }
		})

		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'attempt limit reached'
			}
		})
		ErrorUtil.errorResponse.mockImplementationOnce(() => {
			throw new Error('Mock Error')
		})

		return AssessmentStore.endAttemptWithAPICall('assessmentId', 'mock-context').then(() => {
			expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
			// eslint-disable-next-line no-console
			expect(console.error).toHaveBeenCalledWith(expect.any(Error))
		})
	})

	test('endAttemptWithAPICall shows an error if the endAttempt request fails and triggers a change', async () => {
		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'Some unexpected error that was not accounted for'
			}
		})

		AssessmentStore.state = {
			assessments: {
				assessmentId: {
					current: {
						attemptId: 'mock-attempt-id'
					}
				}
			}
		}

		const updateAfter = jest.spyOn(AssessmentStore, 'updateStateAfterEndAttempt')
		updateAfter.mockReturnValueOnce()

		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(0)
		expect(AssessmentStore.updateStateAfterEndAttempt).toHaveBeenCalledTimes(0)
		expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(0)

		await AssessmentStore.endAttemptWithAPICall('assessmentId', 'mock-context')

		expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.updateStateAfterEndAttempt).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
	})

	test('endAttemptWithAPICall calls endAttempt with correct args', async () => {
		AssessmentStore.setState({
			assessments: {
				['mock-assessment-id']: {
					current: {
						attemptId: 'mock-attempt-id',
						state: {
							chosen: []
						}
					}
				}
			}
		})

		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		// reject so we can skip setup for inner logic
		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'mockError'
			}
		})

		await expect(
			AssessmentStore.endAttemptWithAPICall('mock-assessment-id', 'mock-context')
		).resolves.toBe()

		expect(AssessmentAPI.endAttempt).toHaveBeenCalledWith({
			attemptId: 'mock-attempt-id',
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
	})

	test('endAttemptWithAPICall handles endAttempt error', async () => {
		AssessmentStore.setState({
			assessments: {
				['mock-assessment-id']: {
					current: {
						attemptId: 'mock-attempt-id',
						state: {
							chosen: []
						}
					}
				}
			}
		})

		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		// reject so we can skip setup for inner logic
		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'mockError'
			}
		})

		jest.spyOn(AssessmentStore, 'updateStateAfterEndAttempt')
		jest.spyOn(AssessmentStore, 'triggerChange')
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		AssessmentStore.updateStateAfterEndAttempt.mockReturnValue()
		await expect(
			AssessmentStore.endAttemptWithAPICall('mock-assessment-id', 'mock-context')
		).resolves.toBe()

		expect(AssessmentAPI.endAttempt).toHaveBeenCalledWith({
			attemptId: 'mock-attempt-id',
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		expect(AssessmentStore.updateStateAfterEndAttempt).toHaveBeenCalledWith(
			'mock-assessment-id',
			'mock-context'
		)
		expect(AssessmentStore.triggerChange).toHaveBeenCalled()
		expect(AssessmentStore.getAttemptHistory).not.toHaveBeenCalled()
		expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
	})

	test('endAttemptWithAPICall displays score report', async () => {
		// mock out as many internal methods as we can
		// to limit how much internal complexity
		// we have to deal with
		jest.spyOn(AssessmentStore, 'updateStateAfterEndAttempt')
		jest.spyOn(AssessmentStore, 'triggerChange')
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		jest.spyOn(AssessmentStore, 'displayResultsModal')

		// mock the assessment model parts needed
		OboModel.models['mock-assessment-id'] = {
			modelState: {
				rubric: {
					toObject: () => 'mock-rubric-object'
				},
				attempts: ['mock-attempts']
			}
		}

		// place the assessment into the store's state
		AssessmentStore.state = {
			assessments: {
				['mock-assessment-id']: {
					current: {
						attemptId: 'mock-attempt-id'
					},
					attempts: [
						{
							scoreDetails: 'mock-score-details'
						}
					]
				}
			}
		}

		// mock navstore's state
		NavStore.getState.mockReturnValue({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		// mock the label extracted from the model
		NavUtil.getNavLabelForModel.mockReturnValueOnce('mock-nav-label')

		// mock end attempt results
		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			value: {
				attemptNumber: 'mock-attempt-number'
			}
		})

		// mock to skip implementation
		AssessmentStore.updateStateAfterEndAttempt.mockReturnValue()
		AssessmentStore.getAttemptHistory.mockResolvedValueOnce()
		AssessmentStore.triggerChange.mockReturnValue()

		AssessmentScoreReporter.mockImplementation(() => ({
			getReportFor: () => 'mock-score-report'
		}))

		// execute & expect that it resolves
		await expect(
			AssessmentStore.endAttemptWithAPICall('mock-assessment-id', 'mock-context')
		).resolves.toBe()

		// make sure the modal is sent the arguments we expect
		expect(AssessmentStore.displayResultsModal).toHaveBeenCalledWith(
			'mock-nav-label',
			'mock-attempt-number',
			'mock-score-report'
		)
	})

	test('endAttemptWithAPICall displays score report after import', async () => {
		// mock out as many internal methods as we can
		// to limit how much internal complexity
		// we have to deal with
		jest.spyOn(AssessmentStore, 'updateStateAfterEndAttempt')
		jest.spyOn(AssessmentStore, 'triggerChange')
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		jest.spyOn(AssessmentStore, 'displayResultsModal')

		// mock the assessment model parts needed
		OboModel.models['mock-assessment-id'] = {
			modelState: {
				rubric: {
					toObject: () => 'mock-rubric-object'
				},
				attempts: ['mock-attempts']
			}
		}

		// place the assessment into the store's state
		AssessmentStore.state = {
			isResumingAttempt: true,
			assessments: {
				['mock-assessment-id']: {
					current: {
						attemptId: 'mock-attempt-id'
					},
					attempts: [
						{
							scoreDetails: 'mock-score-details'
						}
					]
				}
			}
		}

		// mock navstore's state
		NavStore.getState.mockReturnValue({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		// mock the label extracted from the model
		NavUtil.getNavLabelForModel.mockReturnValueOnce('mock-nav-label')

		// mock end attempt results
		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			value: {
				attemptNumber: 'mock-attempt-number'
			}
		})

		// mock to skip implementation
		AssessmentStore.updateStateAfterEndAttempt.mockReturnValue()
		AssessmentStore.getAttemptHistory.mockResolvedValueOnce()
		AssessmentStore.triggerChange.mockReturnValue()

		AssessmentScoreReporter.mockImplementation(() => ({
			getReportFor: () => 'mock-score-report'
		}))

		// execute & expect that it resolves
		await expect(
			AssessmentStore.endAttemptWithAPICall('mock-assessment-id', 'mock-context')
		).resolves.toBe()

		expect(AssessmentScoreReporter.mock.calls[0][0]).toHaveProperty('allScoreDetails', [
			{ attemptNumber: 'mock-attempt-number' }
		])
	})

	test('updateStateAfterEndAttempt flips questions, resets responses, informs the model and dispatches attemptEnded', () => {
		// mock the assessment model parts needed
		const model = {
			processTrigger: jest.fn()
		}

		OboModel.models['mock-assessment-id'] = model

		AssessmentStore.state = {
			assessments: {
				['mock-assessment-id']: {
					current: {
						state: {
							chosen: [
								{
									id: 'mock-question-id',
									type: 'ObojoboDraft.Chunks.Question'
								}
							]
						}
					},
					currentResponses: ['mock-question-response-id']
				}
			}
		}

		jest.spyOn(Dispatcher, 'trigger')

		AssessmentStore.updateStateAfterEndAttempt('mock-assessment-id', 'mock-context')

		expect(model.processTrigger).toHaveBeenCalledWith('onEndAttempt')
		expect(QuestionUtil.hideQuestion).toHaveBeenCalledWith('mock-question-id', 'mock-context')
		expect(QuestionUtil.clearResponse).toHaveBeenCalledWith(
			'mock-question-response-id',
			'mock-context'
		)
		expect(AssessmentStore.state.assessments['mock-assessment-id'].current).toBe(null)
		expect(Dispatcher.trigger).toHaveBeenCalledWith('assessment:attemptEnded', 'mock-assessment-id')
	})

	test('trySetResponse will not update with no Assessment', () => {
		expect.assertions(1)
		AssessmentAPI.startAttempt.mockResolvedValue(mockStartAttemptResult())
		OboModel.create(getExampleAssessment())

		AssessmentStore.init([])
		return AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId')
			.then(() => AssessmentStore.trySetResponse('q1', ['some response']))
			.then(() => {
				expect(AssessmentUtil.getAssessmentForModel).toHaveBeenCalled()
			})
	})

	test('trySetResponse will update state', () => {
		expect.assertions(2)
		AssessmentAPI.startAttempt.mockResolvedValue(mockStartAttemptResult())
		OboModel.create(getExampleAssessment())

		AssessmentUtil.getAssessmentForModel.mockReturnValueOnce({
			currentResponses: ['q2']
		})

		AssessmentStore.init([])
		return AssessmentStore.startAttemptWithAPICall('draftId', 'visitId', 'assessmentId')
			.then(() => AssessmentStore.trySetResponse('q1', ['some response']))
			.then(() => {
				expect(AssessmentUtil.getAssessmentForModel).toHaveBeenCalled()
				expect(AssessmentStore.triggerChange).toHaveBeenCalled()
			})
	})

	test('setState will update state', () => {
		expect.assertions(1)

		AssessmentStore.setState('mockState')

		expect(AssessmentStore.getState()).toEqual('mockState')
	})

	test('assessment:startAttempt calls startAttemptWithImportScoreOption', () => {
		jest.spyOn(AssessmentStore, 'startAttemptWithImportScoreOption')
		AssessmentStore.startAttemptWithImportScoreOption.mockReturnValueOnce('mock')

		Dispatcher.trigger('assessment:startAttempt', { value: {} })

		expect(AssessmentStore.startAttemptWithImportScoreOption).toHaveBeenCalled()
	})

	test('startAttemptWithImportScoreOption displays import already used', async () => {
		// jest.spyOn(AssessmentStore, 'startImportScoresWithAPICall')
		// jest.spyOn(AssessmentStore, 'startAttemptWithAPICall')
		AssessmentStore.state = {
			importHasBeenUsed: true
		}

		jest.spyOn(AssessmentStore, 'displayImportAlreadyUsed')
		AssessmentStore.displayImportAlreadyUsed.mockReturnValueOnce()
		await expect(AssessmentStore.startAttemptWithImportScoreOption('assessmentId')).resolves
		expect(AssessmentStore.displayImportAlreadyUsed).toHaveBeenCalled()
	})

	test('startAttemptWithImportScoreOption asks user to import and imports', async () => {
		jest.spyOn(AssessmentStore, 'startImportScoresWithAPICall')
		jest.spyOn(AssessmentStore, 'startAttemptWithAPICall')
		jest.spyOn(AssessmentStore, 'displayPreAttemptImportScoreNotice')
		jest.spyOn(AssessmentStore, 'displayImportAlreadyUsed')

		AssessmentStore.state = {
			importHasBeenUsed: false,
			importableScore: {
				assessmentId: 'assessmentId'
			}
		}

		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		AssessmentStore.startImportScoresWithAPICall.mockResolvedValue('mockImportResult')
		AssessmentStore.startAttemptWithAPICall.mockResolvedValueOnce()
		AssessmentStore.displayImportAlreadyUsed.mockReturnValueOnce()
		// call the import callback as soon as the notice is displayed
		AssessmentStore.displayPreAttemptImportScoreNotice.mockResolvedValue(true)

		const result = await AssessmentStore.startAttemptWithImportScoreOption('assessmentId')
		expect(result).toBe('mockImportResult')
	})

	test('startAttemptWithImportScoreOption asks user to import and doesnt', async () => {
		jest.spyOn(AssessmentStore, 'startImportScoresWithAPICall')
		jest.spyOn(AssessmentStore, 'startAttemptWithAPICall')
		jest.spyOn(AssessmentStore, 'displayPreAttemptImportScoreNotice')
		jest.spyOn(AssessmentStore, 'displayImportAlreadyUsed')

		AssessmentStore.state = {
			importHasBeenUsed: false,
			importableScore: {
				assessmentId: 'assessmentId'
			}
		}

		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		AssessmentStore.startImportScoresWithAPICall.mockReturnValueOnce()
		AssessmentStore.startAttemptWithAPICall.mockReturnValueOnce('mockStartAttemptResult')
		AssessmentStore.displayImportAlreadyUsed.mockReturnValueOnce()
		// call the import callback as soon as the notice is displayed
		AssessmentStore.displayPreAttemptImportScoreNotice.mockResolvedValue(false)

		const result = await AssessmentStore.startAttemptWithImportScoreOption('assessmentId')
		expect(AssessmentStore.displayImportAlreadyUsed).not.toHaveBeenCalled()
		expect(AssessmentStore.displayPreAttemptImportScoreNotice).toHaveBeenCalled()
		expect(result).toBe('mockStartAttemptResult')
	})

	test('startAttemptWithImportScoreOption doesnt ask user to import and starts attempt', async () => {
		jest.spyOn(AssessmentStore, 'startImportScoresWithAPICall')
		jest.spyOn(AssessmentStore, 'startAttemptWithAPICall')
		jest.spyOn(AssessmentStore, 'displayPreAttemptImportScoreNotice')
		jest.spyOn(AssessmentStore, 'displayImportAlreadyUsed')

		AssessmentStore.state = {
			importHasBeenUsed: false,
			importableScore: {
				assessmentId: 'ffff'
			}
		}

		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		AssessmentStore.startAttemptWithAPICall.mockResolvedValue('mock-api-call-result')
		const result = await AssessmentStore.startAttemptWithImportScoreOption('assessmentId')
		expect(AssessmentStore.displayImportAlreadyUsed).not.toHaveBeenCalled()
		expect(AssessmentStore.displayPreAttemptImportScoreNotice).not.toHaveBeenCalled()
		expect(result).toBe('mock-api-call-result')
	})

	test('displayPreAttemptImportScoreNotice resolves with onChoice argument', async () => {
		// display the dialog, get a promise
		const promise = AssessmentStore.displayPreAttemptImportScoreNotice(55)

		// get the props of the dialog that was sent to ModalUtil.show()
		const dialogProps = ModalUtil.show.mock.calls[0][0].props

		// execute the onChoice prop function - sending true
		const aUniqueObject = {}
		dialogProps.onChoice(aUniqueObject)

		// now use the promise to capture and return the onChoice argument
		const result = await promise

		// expect promise result to be passed from onChocie to resolve
		expect(result).toBe(aUniqueObject)
	})

	test('assessment:endAttempt calls endAttemptWithAPICall', () => {
		jest.spyOn(AssessmentStore, 'endAttemptWithAPICall')
		AssessmentStore.endAttemptWithAPICall.mockReturnValueOnce('mock')

		AssessmentStore.setState({
			assessments: {
				assessmentId: {}
			}
		})
		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'Some unexpected error that was not accounted for'
			}
		})

		Dispatcher.trigger('assessment:endAttempt', {
			value: { id: 'assessmentId' }
		})

		expect(AssessmentStore.endAttemptWithAPICall).toHaveBeenCalled()
	})

	test('assessment:resendLTIScore calls tryResendLTIScore', () => {
		jest.spyOn(AssessmentStore, 'tryResendLTIScore')
		AssessmentStore.tryResendLTIScore.mockReturnValueOnce('mock')

		AssessmentStore.setState({
			assessments: {
				assessmentId: {}
			}
		})
		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: 'Some unexpected error that was not accounted for'
			}
		})

		Dispatcher.trigger('assessment:resendLTIScore', {
			value: { id: 'assessmentId' }
		})

		expect(AssessmentStore.tryResendLTIScore).toHaveBeenCalled()
	})

	test('question:setResponse calls trySetResponse', () => {
		OboModel.create(getExampleAssessment())
		jest.spyOn(AssessmentStore, 'trySetResponse')
		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		AssessmentStore.trySetResponse.mockReturnValueOnce('mock')

		Dispatcher.trigger('question:setResponse', { value: { id: 'q1' } })

		expect(AssessmentStore.trySetResponse).toHaveBeenCalled()
	})

	test('window:closeAttempt calls AssessmentUtil', () => {
		Dispatcher.trigger('window:closeAttempt')

		expect(AssessmentUtil.isInAssessment).toHaveBeenCalled()
	})

	test('window:closeAttempt calls AssessmentUtil', () => {
		AssessmentUtil.isInAssessment.mockReturnValueOnce(true)
		const mockFunction = jest.fn()

		Dispatcher.trigger('window:closeAttempt', mockFunction)

		expect(AssessmentUtil.isInAssessment).toHaveBeenCalled()
		expect(mockFunction).toHaveBeenCalled()
	})

	test('nav:afterNavChange determines if destination is an assessment', () => {
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		OboModel.create(getExampleAssessment())
		AssessmentStore.getAttemptHistory.mockReturnValue()

		expect(AssessmentStore).not.toHaveProperty('assessmentIds')
		Dispatcher.trigger('nav:afterNavChange', { value: { to: 'assessmentId' } })
		expect(AssessmentStore).toHaveProperty('assessmentIds')
		expect(AssessmentStore.getAttemptHistory).toHaveBeenCalled()
	})

	test('nav:afterNavChange determines if destination is not an assessment', () => {
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		OboModel.create(getExampleAssessment())
		AssessmentStore.getAttemptHistory.mockReturnValue()

		expect(AssessmentStore).not.toHaveProperty('assessmentIds')
		Dispatcher.trigger('nav:afterNavChange', { value: { to: 'not-going-to-find-me' } })
		expect(AssessmentStore).toHaveProperty('assessmentIds')
		expect(AssessmentStore.getAttemptHistory).not.toHaveBeenCalled()

		// dispatch again just to test the else path that skips creating the set
		Dispatcher.trigger('nav:afterNavChange', { value: { to: 'not-going-to-find-me' } })
	})

	test('onCloseResultsDialog hides modal and focuses on nav target content', () => {
		AssessmentStore.onCloseResultsDialog()

		expect(ModalUtil.hide).toHaveBeenCalledTimes(1)
		expect(FocusUtil.focusOnNavTarget).toHaveBeenCalledTimes(1)
	})

	test('updateStateAfterEndAttempt hides questions, clears responses and triggers events', () => {
		// setup
		OboModel.create(getExampleAssessment())
		OboModel.models['assessmentId'].processTrigger = jest.fn()
		AssessmentStore.state = {
			assessments: {
				['assessmentId']: {
					current: {
						state: {
							chosen: [
								{ type: 'not-a-question', id: 1 },
								{ type: 'ObojoboDraft.Chunks.Question', id: 2 }
							]
						}
					},
					currentResponses: [10]
				}
			}
		}
		jest.spyOn(Dispatcher, 'trigger')
		QuestionUtil.hideQuestion.mockReturnValue()
		QuestionUtil.clearResponse.mockReturnValue()

		// execute
		AssessmentStore.updateStateAfterEndAttempt('assessmentId', 'mock-context')

		// verify
		expect(OboModel.models['assessmentId'].processTrigger).toHaveBeenCalledWith('onEndAttempt')
		expect(Dispatcher.trigger).toHaveBeenCalledWith('assessment:attemptEnded', 'assessmentId')
		expect(AssessmentStore.state.assessments['assessmentId'].current).toBeNull()

		expect(QuestionUtil.hideQuestion).toHaveBeenCalledTimes(1)
		expect(QuestionUtil.hideQuestion).toHaveBeenCalledWith(2, 'mock-context')

		expect(QuestionUtil.clearResponse).toHaveBeenCalledTimes(1)
		expect(QuestionUtil.clearResponse).toHaveBeenCalledWith(10, 'mock-context')
	})

	test('getOrCreateAssessmentSummaryById creates a new assessmentSummary', () => {
		AssessmentStore.state = {
			assessmentSummary: [{ assessmentId: 'existing-id1' }, { assessmentId: 'existing-id2, ' }]
		}

		expect(AssessmentStore.state.assessmentSummary).toHaveLength(2)
		const result = AssessmentStore.getOrCreateAssessmentSummaryById('mock-assessment-id')
		expect(AssessmentStore.state.assessmentSummary).toHaveLength(3)
		expect(result).toBe(AssessmentStore.state.assessmentSummary[2])
		expect(AssessmentStore.state.assessmentSummary[2]).toMatchInlineSnapshot(`
		Object {
		  "assessmentId": "mock-assessment-id",
		  "importUsed": false,
		  "scores": Array [],
		  "unfinishedAttemptId": null,
		}
	`)
	})

	test('getOrCreateAssessmentSummaryById finds an existing assessmentSummary', () => {
		AssessmentStore.state = {
			assessmentSummary: [{ assessmentId: 'existing-id1' }, { assessmentId: 'existing-id2, ' }]
		}

		expect(AssessmentStore.state.assessmentSummary).toHaveLength(2)
		const result = AssessmentStore.getOrCreateAssessmentSummaryById('existing-id1')
		expect(AssessmentStore.state.assessmentSummary).toHaveLength(2)
		expect(result).toBe(AssessmentStore.state.assessmentSummary[0])
		expect(AssessmentStore.state.assessmentSummary[0]).toMatchInlineSnapshot(`
		Object {
		  "assessmentId": "existing-id1",
		}
	`)
	})

	test('updateStateAfterAttemptHistory', () => {
		jest.spyOn(AssessmentStore, 'getOrCreateAssessmentSummaryById')
		jest.spyOn(AssessmentStore, 'getOrCreateAssessmentById')
		jest.spyOn(QuestionStore, 'updateStateByContext')

		AssessmentStore.state = {
			assessmentSummary: [],
			assessments: []
		}

		const attemptsByAssessment = [
			{
				assessmentId: 'mock-assessment-id',
				attempts: [
					{
						id: 'mock-attempt-id',
						result: {
							attemptScore: 10,
							questionScores: [{ id: 10 }]
						},
						questionResponses: [
							{
								questionId: 'mock-q-id',
								response: 'mock-resp'
							}
						]
					}
				]
			}
		]
		AssessmentStore.state = {
			assessments: {
				['mock-assessment-id']: attemptsByAssessment
			}
		}
		AssessmentStore.getOrCreateAssessmentSummaryById.mockReturnValueOnce({})
		// AssessmentStore.getOrCreateAssessmentById.mockReturnValueOnce()
		AssessmentStore.updateStateAfterAttemptHistory(attemptsByAssessment)
		// expect(AssessmentStore.state).toHaveProperty('importHasBeenUsed', true)
		// expect(AssessmentStore.state).toHaveProperty('importableScore', true)
		expect(QuestionStore.updateStateByContext).toHaveBeenCalledTimes(1)
		expect(QuestionStore.updateStateByContext.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "responses": Object {
		      "mock-q-id": "mock-resp",
		    },
		    "scores": Object {
		      "10": Object {
		        "id": 10,
		      },
		    },
		  },
		  "assessmentReview:mock-attempt-id",
		]
	`)
	})

	test('updateStateAfterAttemptHistory when import is used', () => {
		jest.spyOn(AssessmentStore, 'getOrCreateAssessmentSummaryById')
		jest.spyOn(AssessmentStore, 'getOrCreateAssessmentById')
		jest.spyOn(QuestionStore, 'updateStateByContext')

		AssessmentStore.state = {
			assessmentSummary: [],
			assessments: []
		}

		const attemptsByAssessment = [
			{
				assessmentId: 'mock-assessment-id',
				attempts: [
					{
						id: 'mock-attempt-id',
						isImported: true,
						isFinished: true,
						result: {
							attemptScore: 10,
							questionScores: [{ id: 10 }]
						},
						questionResponses: [
							{
								questionId: 'mock-q-id',
								response: 'mock-resp'
							}
						]
					}
				]
			}
		]
		AssessmentStore.state = {
			assessments: {
				['mock-assessment-id']: attemptsByAssessment
			}
		}
		AssessmentStore.getOrCreateAssessmentSummaryById.mockReturnValueOnce({})
		// AssessmentStore.getOrCreateAssessmentById.mockReturnValueOnce()
		AssessmentStore.updateStateAfterAttemptHistory(attemptsByAssessment)
		// expect(AssessmentStore.state).toHaveProperty('importHasBeenUsed', true)
		// expect(AssessmentStore.state).toHaveProperty('importableScore', true)
		expect(AssessmentStore.state).toHaveProperty('importHasBeenUsed', true)
	})

	test('getAttemptHistory handles api errors', async () => {
		jest.spyOn(AssessmentStore, 'updateStateAfterAttemptHistory')
		AssessmentStore.state = {
			attemptHistoryLoadState: 'none'
		}

		NavStore.getState.mockReturnValue({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		AssessmentAPI.getAttemptHistory.mockResolvedValueOnce({
			status: 'error',
			value: ''
		})

		await AssessmentStore.getAttemptHistory()

		expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
		expect(AssessmentAPI.getAttemptHistory).toHaveBeenCalled()
		expect(AssessmentStore.updateStateAfterAttemptHistory).not.toHaveBeenCalled()
		expect(AssessmentStore.triggerChange).not.toHaveBeenCalled()
	})

	test('getAttemptHistory does nothing after loading', async () => {
		jest.spyOn(AssessmentStore, 'updateStateAfterAttemptHistory')
		AssessmentStore.state = {
			attemptHistoryLoadState: 'loaded'
		}

		await AssessmentStore.getAttemptHistory()
		expect(AssessmentAPI.getAttemptHistory).not.toHaveBeenCalled()
		expect(AssessmentStore.updateStateAfterAttemptHistory).not.toHaveBeenCalled()
		expect(AssessmentStore.triggerChange).not.toHaveBeenCalled()
	})

	test('getAttemptHistory loads history, updates, and triggers change', async () => {
		jest.spyOn(AssessmentStore, 'updateStateAfterAttemptHistory')
		AssessmentStore.updateStateAfterAttemptHistory.mockReturnValue()
		NavStore.getState.mockReturnValue({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		AssessmentStore.state = {
			attemptHistoryLoadState: 'none'
		}
		AssessmentAPI.getAttemptHistory.mockResolvedValueOnce({
			status: 'ok',
			value: 'mock-api-attempt-history'
		})

		await AssessmentStore.getAttemptHistory()
		expect(AssessmentAPI.getAttemptHistory).toHaveBeenCalledTimes(1)
		expect(AssessmentAPI.getAttemptHistory).toHaveBeenCalledWith({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})
		expect(AssessmentStore.updateStateAfterAttemptHistory).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.updateStateAfterAttemptHistory).toHaveBeenCalledWith(
			'mock-api-attempt-history'
		)
		expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.state).toHaveProperty('attemptHistoryLoadState', 'loaded')
	})

	test('startImportScoresWithAPICall errors', () => {
		AssessmentAPI.importScore.mockRejectedValueOnce('mock-error')
		AssessmentStore.state = {
			importableScore: {
				assessmentScoreId: 10
			}
		}
		expect(AssessmentStore.startImportScoresWithAPICall()).rejects.toBe('mock-error')
	})

	test('startImportScoresWithAPICall calls start attempt and updates state', async () => {
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		AssessmentAPI.importScore.mockResolvedValueOnce({
			status: 'ok'
		})
		AssessmentStore.state = {
			importableScore: {
				assessmentScoreId: 10
			}
		}

		AssessmentStore.getAttemptHistory.mockResolvedValueOnce('get-attempt-history-result')
		const result = await AssessmentStore.startImportScoresWithAPICall(
			'mock-draft-id',
			'mock-visit-id',
			'mock-assessment-id'
		)
		expect(result).toBe('get-attempt-history-result')
		expect(AssessmentAPI.importScore).toHaveBeenCalledTimes(1)
		expect(AssessmentAPI.importScore.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "assessmentId": "mock-assessment-id",
		    "draftId": "mock-draft-id",
		    "importedAssessmentScoreId": 10,
		    "visitId": "mock-visit-id",
		  },
		]
	`)
		expect(AssessmentStore.getAttemptHistory).toHaveBeenCalledTimes(1)
	})

	test('startImportScoresWithAPICall sends api errors to ErrorUtil', () => {
		jest.spyOn(AssessmentStore, 'getAttemptHistory')
		AssessmentAPI.importScore.mockResolvedValueOnce({
			status: 'error'
		})
		AssessmentStore.state = {
			importableScore: {
				assessmentScoreId: 10
			}
		}

		return AssessmentStore.startImportScoresWithAPICall().then(() => {
			expect(ErrorUtil.errorResponse).toHaveBeenCalledTimes(1)
			expect(AssessmentStore.triggerChange).toHaveBeenCalledTimes(0)
		})
	})

	test('displayPreAttemptImportScoreNotice calls ModalUtil.show', () => {
		AssessmentStore.displayPreAttemptImportScoreNotice(50)
		expect(ModalUtil.show).toHaveBeenCalled()
		expect(ModalUtil.show).toHaveBeenCalledWith(
			<ImportDialog highestScore={50} onChoice={expect.any(Function)} />
		)
	})

	test('displayResultsModal calls ModalUtil.show', () => {
		const report = {}
		AssessmentStore.displayResultsModal('label', 10, report)
		expect(ModalUtil.show).toHaveBeenCalled()
		expect(ModalUtil.show).toHaveBeenCalledWith(
			<ResultsDialog
				attemptNumber={10}
				label="label"
				onShowClick={expect.any(Function)}
				scoreReport={report}
			/>
		)
	})

	test('displayImportAlreadyUsed ', () => {
		jest.spyOn(Dispatcher, 'trigger')
		AssessmentStore.displayImportAlreadyUsed()
		expect(Dispatcher.trigger).toHaveBeenCalledWith('viewer:alert', expect.any(Object))
	})

	test('resuming an attempt for a different module restarts an attempt', async () => {
		NavStore.getState.mockReturnValue({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		const mockResumeAttemptResponse = {
			status: 'error',
			value: {
				message: ERROR_INVALID_ATTEMPT_RESUME
			}
		}

		AssessmentStore.state = {
			assessmentSummary: [
				{
					assessmentId: 'mockAssessmentId',
					unfinishedAttemptId: 'mockUnfinishedId'
				}
			]
		}

		AssessmentAPI.resumeAttempt.mockResolvedValueOnce(mockResumeAttemptResponse)

		jest.spyOn(AssessmentStore, 'updateStateAfterStartAttempt')
		jest.spyOn(AssessmentStore, 'startAttemptWithImportScoreOption')
		jest.spyOn(AssessmentStore, 'findUnfinishedAttemptInAssessmentSummary')

		AssessmentStore.updateStateAfterStartAttempt.mockReturnValueOnce()

		await AssessmentStore.resumeAttemptWithAPICall('resume-attempt-id')

		expect(ModalUtil.hide).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.updateStateAfterStartAttempt).not.toHaveBeenCalled()
		expect(AssessmentStore.updateStateAfterStartAttempt).not.toHaveBeenCalledWith()
		expect(AssessmentStore.triggerChange).not.toHaveBeenCalled()

		expect(AssessmentStore.startAttemptWithImportScoreOption).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.findUnfinishedAttemptInAssessmentSummary).toHaveBeenCalledTimes(1)

		expect(AssessmentStore.startAttemptWithImportScoreOption).toHaveBeenCalledWith(
			'mockAssessmentId'
		)

		AssessmentStore.updateStateAfterStartAttempt.mockRestore()
	})

	test('endAttemptWithAPICall starts a new attempt if module is different', async () => {
		AssessmentStore.setState({
			assessments: {
				['mock-assessment-id']: {
					current: {
						attemptId: 'mock-attempt-id',
						state: {
							chosen: []
						}
					}
				}
			}
		})

		NavStore.getState.mockReturnValueOnce({
			draftId: 'mockDraftId',
			visitId: 'mockVisitId'
		})

		AssessmentAPI.endAttempt.mockResolvedValueOnce({
			status: 'error',
			value: {
				message: ERROR_INVALID_ATTEMPT_END
			}
		})

		jest.spyOn(AssessmentStore, 'updateStateAfterEndAttempt')
		jest.spyOn(AssessmentStore, 'triggerChange')
		jest.spyOn(Dispatcher, 'trigger')

		await expect(
			AssessmentStore.endAttemptWithAPICall('mock-assessment-id', 'mock-context')
		).resolves.toBe()

		expect(ModalUtil.show).toHaveBeenCalledTimes(1)
		expect(ModalUtil.show).toHaveBeenCalledWith(
			<UpdatedModuleDialog onConfirm={expect.any(Function)} />,
			false
		)
		expect(Dispatcher.trigger).toHaveBeenCalledWith('assessment:attemptEnded', 'mock-assessment-id')
		expect(AssessmentStore.updateStateAfterEndAttempt).not.toHaveBeenCalled()
		expect(AssessmentStore.triggerChange).not.toHaveBeenCalled()
	})

	test('onCloseUpdatedModuleDialog restarts attempt with same id', () => {
		jest.spyOn(AssessmentStore, 'startAttemptWithImportScoreOption')

		AssessmentStore.onCloseUpdatedModuleDialog('mock-id')

		expect(ModalUtil.hide).toHaveBeenCalled()
		expect(AssessmentStore.startAttemptWithImportScoreOption).toHaveBeenCalledTimes(1)
		expect(AssessmentStore.startAttemptWithImportScoreOption).toHaveBeenCalledWith('mock-id')
	})
})
