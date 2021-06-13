import AssessmentUtil from 'obojobo-document-engine/src/scripts/viewer/util/assessment-util'
import FullReview from './index'
import NavUtil from 'obojobo-document-engine/src/scripts/viewer/util/nav-util'
import OboModel from 'obojobo-document-engine/src/scripts/common/models/obo-model'
import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'

jest.mock('obojobo-document-engine/src/scripts/viewer/util/assessment-util')
jest.mock('obojobo-document-engine/src/scripts/viewer/util/nav-util')
jest.mock('../assessment-score-reporter')
jest.mock('../assessment-score-report-view', () => {
	return () => <div>Mock assessment score report view</div>
})
jest.mock('obojobo-document-engine/src/scripts/common/util/uuid', () => () => 'mock-uuid')

// register the modules required for this test
require('../../viewer')
require('obojobo-chunks-question/viewer')
require('obojobo-pages-page/viewer')
require('obojobo-chunks-text/viewer')
require('obojobo-chunks-multiple-choice-assessment/viewer')
require('obojobo-chunks-question-bank/viewer')

const questionJSON = {
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
			children: [questionJSON]
		}
	]
}

describe('FullReview', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('FullReview component', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)
		const attempts = []
		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttempt' })
		// mock attempts taken
		// AssessmentUtil.getAllAttempts.mockReturnValueOnce([])
		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(0)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with attempt', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({
			id: 'mockAttemptId'
		})
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{ id: 'mockId' }
		])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId',
				attemptNumber: 3,
				assessmentScore: 80,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					]
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			}
		]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(1)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with assessment review context', () => {
		const moduleData = {
			assessmentState: 'assessmentReview:mockAssessmentState',
			navState: {
				context: 'assessmentReview:mockAttemptId'
			},
			questionState: {
				contexts: {
					'assessmentReview:mockAttemptId': {
						scores: {},
						responses: {},
						revealedQuestions: {}
					}
				}
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttemptId' })
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId',
				attemptNumber: 3,
				assessmentScore: 80,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					],
					attemptScore: 80.34
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			}
		]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(7)
		AssessmentUtil.getNumCorrect.mockReturnValueOnce(6)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with assessment review context', () => {
		const moduleData = {
			assessmentState: 'assessmentReview:mockAssessmentState',
			navState: {
				context: 'assessmentReview:mockAttemptId'
			},
			questionState: {
				contexts: {
					'assessmentReview:mockAttemptId': {
						scores: {},
						responses: {},
						revealedQuestions: {}
					}
				}
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttemptId' })
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId',
				attemptNumber: 3,
				assessmentScore: 50,
				isImported: true,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					],
					attemptScore: 50
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			}
		]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(7)
		AssessmentUtil.getNumCorrect.mockReturnValueOnce(6)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with fully displayed attempt', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({
			id: 'lastAttemptMockAttemptId'
		})
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			{ id: 'highestMockAttemptId' }
		])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId_1',
				attemptNumber: 3,
				assessmentScore: 80,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					]
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			}
		]

		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(1)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} showFullReview={true} />
		)

		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with non-passing attempt', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttemptId' })
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId',
				attemptNumber: 3,
				assessmentScore: null, // student did not pass
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: []
				}
			}
		]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(0)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with highest attempt', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)
		const mockAttempt = {
			id: 'mockAttemptId',
			attemptNumber: 3,
			assessmentScore: 80.34,
			completedAt: '2018-06-05 20:28:11.228294+00',
			result: {
				questionScores: []
			}
		}

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttemptId' })
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([mockAttempt])
		// mock attempt taken
		const attempts = [mockAttempt]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValueOnce(1)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)

		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with two attempts', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			questionState: { scores: {} },
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttemptId' })
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId',
				attemptNumber: 3,
				assessmentScore: 80,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					]
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			},
			{
				id: 'mockSecondAttemptId',
				assessmentScore: 80.34,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					]
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			}
		]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValue(1)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)

		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with five attempts', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'mockContext'
			},
			questionState: { scores: {} },
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		const firstAttempt = {
			id: 'mockFirstAttemptId',
			attemptNumber: 1,
			assessmentScore: 100,
			completedAt: '2018-06-05 20:28:11.228294+00',
			result: {
				attemptScore: 100,
				questionScores: [
					{
						id: 'questionId'
					}
				]
			},
			state: {
				questionModels: {
					questionId: questionJSON
				}
			}
		}

		const secondAttempt = {
			id: 'mockSecondAttemptId',
			attemptNumber: 1,
			assessmentScore: 0,
			completedAt: '2018-06-05 20:28:11.228294+00',
			result: {
				attemptScore: 0,
				questionScores: [
					{
						id: 'questionId'
					}
				]
			},
			state: {
				questionModels: {
					questionId: questionJSON
				}
			}
		}

		const thirdAttempt = {
			id: 'mockThirdAttemptId',
			attemptNumber: 1,
			assessmentScore: 80,
			completedAt: '2018-06-05 20:28:11.228294+00',
			result: {
				attemptScore: 80,
				questionScores: [
					{
						id: 'questionId'
					}
				]
			},
			state: {
				questionModels: {
					questionId: questionJSON
				}
			}
		}
		const fourthAttempt = {
			id: 'mockFourthAttemptId',
			attemptNumber: 1,
			assessmentScore: 0,
			completedAt: '2018-06-05 20:28:11.228294+00',
			result: {
				attemptScore: 0,
				questionScores: [
					{
						id: 'questionId'
					}
				]
			},
			state: {
				questionModels: {
					questionId: questionJSON
				}
			}
		}

		const fifthAttempt = {
			id: 'mockFifthAttemptId',
			attemptNumber: 1,
			assessmentScore: 100,
			completedAt: '2018-06-05 20:28:11.228294+00',
			result: {
				attemptScore: 95,
				questionScores: [
					{
						id: 'questionId'
					}
				]
			},
			state: {
				questionModels: {
					questionId: questionJSON
				}
			}
		}

		// All mock attempts taken
		const attempts = [firstAttempt, secondAttempt, thirdAttempt, fourthAttempt, fifthAttempt]

		// Mocking the last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockFifthAttemptId' })
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([
			firstAttempt,
			secondAttempt,
			thirdAttempt,
			fourthAttempt,
			fifthAttempt
		])
		AssessmentUtil.getNumPossibleCorrect.mockReturnValue(1)

		const component = renderer.create(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)

		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('FullReview component with two attempts swaps view when clicked', () => {
		const moduleData = {
			assessmentState: 'mockAssessmentState',
			navState: {
				context: 'assessmentReview:mockAttemptId'
			},
			questionState: {
				contexts: {
					'assessmentReview:mockAttemptId': {
						scores: {},
						responses: {},
						revealedQuestions: {}
					}
				}
			},
			focusState: {}
		}
		const model = OboModel.create(assessmentJSON)

		// mock last attempt taken
		AssessmentUtil.getLastAttemptForModel.mockReturnValueOnce({ id: 'mockAttemptId' })
		// mock highest attempt
		AssessmentUtil.getHighestAttemptsForModelByAssessmentScore.mockReturnValueOnce([])
		// mock attempt taken
		const attempts = [
			{
				id: 'mockAttemptId',
				attemptNumber: 3,
				assessmentScore: 80,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					]
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			},
			{
				id: 'mockSecondAttemptId',
				attemptNumber: 2,
				assessmentScore: 100,
				completedAt: '2018-06-05 20:28:11.228294+00',
				result: {
					questionScores: [
						{
							id: 'questionId'
						}
					]
				},
				state: {
					questionModels: {
						questionId: questionJSON
					}
				}
			}
		]
		AssessmentUtil.getNumPossibleCorrect.mockReturnValue(1)

		const component = mount(
			<FullReview model={model} moduleData={moduleData} attempts={attempts} />
		)

		expect(NavUtil.setContext).toHaveBeenCalledTimes(1)
		expect(NavUtil.setContext).toHaveBeenCalledWith('assessmentReview:mockAttemptId')

		// simulate clicking the button for the second attempt
		component
			.find('.attempt-button-container')
			.childAt(0)
			.childAt(0)
			.childAt(1)
			.find('button')
			.simulate('click')

		expect(NavUtil.setContext).toHaveBeenCalledTimes(2)
		expect(NavUtil.setContext).toHaveBeenCalledWith('assessmentReview:mockSecondAttemptId')
	})
})
