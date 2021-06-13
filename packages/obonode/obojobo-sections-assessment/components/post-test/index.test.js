import AssessmentUtil from 'obojobo-document-engine/src/scripts/viewer/util/assessment-util'
import Dispatcher from 'obojobo-document-engine/src/scripts/common/flux/dispatcher'
import { FOCUS_ON_ASSESSMENT_CONTENT } from '../../assessment-event-constants'
import OboModel from 'obojobo-document-engine/src/scripts/common/models/obo-model'
import PostTest from './index'
import React from 'react'
import focus from 'obojobo-document-engine/src/scripts/common/page/focus'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'
import AssessmentAPI from 'obojobo-document-engine/src/scripts/viewer/util/assessment-api'

jest.mock('obojobo-document-engine/src/scripts/viewer/util/assessment-util')
jest.mock('obojobo-document-engine/src/scripts/viewer/util/nav-util')
jest.mock('obojobo-document-engine/src/scripts/viewer/util/viewer-api')
jest.mock('obojobo-document-engine/src/scripts/viewer/util/assessment-api')
jest.mock('obojobo-document-engine/src/scripts/common/flux/dispatcher')
jest.mock('obojobo-document-engine/src/scripts/common/page/focus')
jest.mock('../assessment-score-reporter')
jest.mock('../full-review/index')

const FULL_REVIEW_ALWAYS = 'always'
const FULL_REVIEW_AFTER_ALL = 'no-attempts-remaining'

// register the modules required for this test
require('../../viewer')
require('obojobo-chunks-question/viewer')
require('obojobo-pages-page/viewer')
require('obojobo-chunks-text/viewer')
require('obojobo-chunks-heading/viewer')
require('obojobo-chunks-action-button/viewer')
require('obojobo-chunks-multiple-choice-assessment/viewer')
require('obojobo-chunks-question/viewer')
require('obojobo-chunks-question-bank/viewer')

const assessmentJSON = {
	id: 'assessment',
	type: 'ObojoboDraft.Sections.Assessment',
	content: {
		attempts: 3
	},
	children: [
		{
			id: 'page',
			type: 'ObojoboDraft.Pages.Page',
			children: [
				{
					id: 'child',
					type: 'ObojoboDraft.Chunks.Text',
					content: {
						textGroup: [
							{
								text: {
									value:
										'You have {{assessment:attemptsRemaining}} attempts remaining out of {{assessment:attemptsAmount}}.'
								}
							}
						]
					}
				}
			]
		},
		{
			id: 'QuestionBank',
			type: 'ObojoboDraft.Chunks.QuestionBank',
			children: [
				{
					id: 'question',
					type: 'ObojoboDraft.Chunks.Question',
					content: {
						title: 'Title',
						solution: {
							id: 'page-id',
							type: 'ObojoboDraft.Pages.Page',
							children: [
								{
									id: 'text-id',
									type: 'ObojoboDraft.Chunks.Text',
									content: {
										textGroup: [
											{
												text: {
													value: 'Example text'
												}
											}
										]
									}
								}
							]
						}
					},
					children: [
						{
							id: 'mcassessment',
							type: 'ObojoboDraft.Chunks.MCAssessment',
							children: [
								{
									id: 'choice1',
									type: 'ObojoboDraft.Chunks.MCAssessment.MCChoice',
									content: {
										score: 100
									},
									children: [
										{
											id: 'choice1-answer',
											type: 'ObojoboDraft.Chunks.MCAssessment.MCAnswer',
											children: [
												{
													id: 'choice1-answer-text',
													type: 'ObojoboDraft.Chunks.Text',
													content: {
														textGroup: [
															{
																text: {
																	value: 'Example Text'
																}
															}
														]
													}
												}
											]
										},
										{
											id: 'choice1-feedback',
											type: 'ObojoboDraft.Chunks.MCAssessment.MCFeedback',
											children: [
												{
													id: 'choice1-feedback-text',
													type: 'ObojoboDraft.Chunks.Text',
													content: {
														textGroup: [
															{
																text: {
																	value: 'Example Text 2'
																}
															}
														]
													}
												}
											]
										}
									]
								},
								{
									id: 'choice2',
									type: 'ObojoboDraft.Chunks.MCAssessment.MCChoice',
									content: {
										score: 0
									},
									children: [
										{
											id: 'choice2-answer',
											type: 'ObojoboDraft.Chunks.MCAssessment.MCAnswer',
											children: [
												{
													id: 'choice1-answer-text',
													type: 'ObojoboDraft.Chunks.Text',
													content: {
														textGroup: [
															{
																text: {
																	value: 'Example Text 3'
																}
															}
														]
													}
												}
											]
										},
										{
											id: 'choice2-feedback',
											type: 'ObojoboDraft.Chunks.MCAssessment.MCFeedback',
											children: [
												{
													id: 'choice1-feedback-text',
													type: 'ObojoboDraft.Chunks.Text',
													content: {
														textGroup: [
															{
																text: {
																	value: 'Example Text 4'
																}
															}
														]
													}
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		}
	]
}
const scoreActionJSON = {
	id: '2692c3fa-2bd9-4f62-a83f-a173b4770017',
	type: 'ObojoboDraft.Pages.Page',
	content: {},
	children: [
		{
			id: '084af3aa-18be-41d5-9938-1b4c311403fa',
			type: 'ObojoboDraft.Chunks.Heading',
			content: {
				headingLevel: 1,
				textGroup: [
					{
						text: {
							value: 'Not quite!',
							styleList: []
						},
						data: {
							align: 'center'
						}
					}
				]
			},
			children: []
		},
		{
			id: '13b82592-8c45-4fe7-9d00-32a66f4d7418',
			type: 'ObojoboDraft.Chunks.ActionButton',
			content: {
				textGroup: [
					{
						text: {
							value: 'Try again ({{assessment:attemptsRemaining}} attempts left)',
							styleList: []
						},
						data: null
					}
				],
				triggers: [
					{
						type: 'onClick',
						actions: [
							{
								type: 'assessment:startAttempt',
								value: {
									id: 'assessment'
								}
							}
						]
					}
				]
			},
			children: []
		}
	]
}

describe('PostTest', () => {
	let moduleData
	let model
	let scoreAction

	beforeEach(() => {
		jest.resetAllMocks()
		AssessmentUtil.getAllAttempts.mockReturnValueOnce([
			{
				attemptId: 1,
				state: {
					questionModels: []
				}
			}
		])

		AssessmentUtil.isAttemptHistoryLoadedForModel.mockReturnValue(true)

		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: {
					attemptNumber: 'mockAttemptNumber'
				}
			}
		])
		AssessmentUtil.getAssessmentScoreForModel.mockReturnValue(null)
		AssessmentUtil.isFullReviewAvailableForModel.mockReturnValue(false)
		AssessmentAPI.reviewAttempt.mockResolvedValue({})

		moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			lti: {
				outcomeServiceHostname: 'mockLTIHost'
			},
			focusState: {}
		}
		model = OboModel.create(assessmentJSON)
		scoreAction = {
			page: scoreActionJSON
		}
	})

	test('PostTest component', () => {
		scoreAction = {
			page: null,
			message: 'mockMessage'
		}

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	test('PostTest shows throbber if history is not yet loaded', () => {
		AssessmentUtil.isAttemptHistoryLoadedForModel.mockReturnValue(false)
		scoreAction = {
			page: null,
			message: 'mockMessage'
		}

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)

		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	test('PostTest component with scoreAction', () => {
		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	test('PostTest component with recorded score', () => {
		AssessmentUtil.getAssessmentScoreForModel.mockReturnValue(100)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValue([
			{
				scoreDetails: {
					attemptNumber: 'mockAttemptNumber'
				}
			}
		])

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const initialRender = component.toJSON()
		expect(initialRender).toMatchSnapshot()

		const afterFetchRender = component.toJSON()
		expect(afterFetchRender).toMatchSnapshot()
		component.unmount()
	})

	test('PostTest component with review', () => {
		model.modelState.review = FULL_REVIEW_ALWAYS
		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(100)
		AssessmentUtil.isFullReviewAvailableForModel.mockReturnValue(true)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: { attemptNumber: 'mockAttemptNumber' }
			}
		])

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	test('PostTest component with review after all attempts - attempts remaining', () => {
		model.modelState.review = FULL_REVIEW_AFTER_ALL

		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(100)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: { attemptNumber: 'mockAttemptNumber' }
			}
		])
		AssessmentUtil.hasAttemptsRemaining.mockReturnValueOnce(true)

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	test('PostTest component with review with imported score', () => {
		model.modelState.review = FULL_REVIEW_AFTER_ALL
		moduleData.assessmentState = { importHasBeenUsed: true }

		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(100)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: { attemptNumber: 'mockAttemptNumber' }
			}
		])
		AssessmentUtil.hasAttemptsRemaining.mockReturnValueOnce(true)

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	test('PostTest component with review after all attempts - no attempts remaining', () => {
		model.modelState.review = FULL_REVIEW_AFTER_ALL
		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(100)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: { attemptNumber: 'mockAttemptNumber' }
			}
		])
		AssessmentUtil.hasAttemptsRemaining.mockReturnValueOnce(false)

		const component = renderer.create(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)
		const render = component.toJSON()
		expect(render).toMatchSnapshot()

		component.unmount()
	})

	// This button is actually part of the LTIStatus module
	// The function is in PostTest because it needs the assessment model
	test('PostTest component resends LTI when Resend button is clicked', () => {
		model.modelState.review = FULL_REVIEW_AFTER_ALL
		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(100)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: { attemptNumber: 'mockAttemptNumber' }
			}
		])
		AssessmentUtil.hasAttemptsRemaining.mockReturnValueOnce(false)
		AssessmentUtil.getLTIStateForModel.mockReturnValueOnce({
			state: 'mockState'
		})

		const component = mount(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)

		component
			.childAt(0)
			.childAt(0)
			.childAt(2)
			.find('button')
			.simulate('click')

		expect(AssessmentUtil.resendLTIScore).toHaveBeenCalled()
		component.unmount()
	})

	test('Component listens to FOCUS_ON_ASSESSMENT_CONTENT events when mounted (and stops listening when unmounted)', () => {
		AssessmentUtil.getAssessmentScoreForModel.mockReturnValueOnce(100)
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{
				scoreDetails: { attemptNumber: 'mockAttemptNumber' }
			}
		])

		expect(Dispatcher.on).not.toHaveBeenCalled()
		expect(Dispatcher.off).not.toHaveBeenCalled()

		const component = mount(
			<PostTest model={model} moduleData={moduleData} scoreAction={scoreAction} />
		)

		const boundFocusOnContent = component.instance().boundFocusOnContent
		expect(Dispatcher.on).toHaveBeenCalledTimes(1)
		expect(Dispatcher.on).toHaveBeenCalledWith(FOCUS_ON_ASSESSMENT_CONTENT, boundFocusOnContent)
		expect(Dispatcher.off).not.toHaveBeenCalled()

		component.unmount()

		expect(Dispatcher.on).toHaveBeenCalledTimes(1)
		expect(Dispatcher.off).toHaveBeenCalledTimes(1)
		expect(Dispatcher.off).toHaveBeenCalledWith(FOCUS_ON_ASSESSMENT_CONTENT, boundFocusOnContent)
	})

	test('focusOnContent calls focus on the h1', () => {
		const postTest = new PostTest()
		postTest.h1Ref = 'mockH1Ref'

		postTest.focusOnContent()

		expect(focus).toHaveBeenCalledWith('mockH1Ref')
	})

	test('focusOnContent calls focus on the h1', () => {
		const postTest = new PostTest()
		postTest.h1Ref = 'mockH1Ref'

		expect(postTest.focusOnContent()).toBe(true)
		expect(focus).toHaveBeenCalledWith('mockH1Ref')
	})

	test('focusOnContent returns false if activeElement cannot be found', () => {
		const postTest = new PostTest()
		postTest.h1Ref = 'mockH1Ref'

		const origActiveElement = document.activeElement
		const mockEl = jest.fn()
		Object.defineProperty(document, 'activeElement', {
			value: mockEl,
			enumerable: true,
			configurable: true
		})

		expect(postTest.focusOnContent()).toBe(false)
		expect(focus).not.toHaveBeenCalled()

		Object.defineProperty(document, 'activeElement', {
			value: origActiveElement
		})
	})
})
