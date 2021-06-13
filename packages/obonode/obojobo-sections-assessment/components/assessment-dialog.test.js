import renderer from 'react-test-renderer'
import React from 'react'

import Common from 'obojobo-document-engine/src/scripts/common'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'

import AssessmentDialog from './assessment-dialog'
import AssessmentScoreReporter from './assessment-score-reporter'
import AssessmentScoreReportView from './assessment-score-report-view'
import { ERROR_INVALID_ATTEMPT_END } from '../server/error-constants'

const { AssessmentMachineStates } = Viewer.stores.assessmentStore
const { CurrentAssessmentStates, AssessmentUtil, FocusUtil } = Viewer.util
const { ModalUtil } = Common.util

const {
	PROMPTING_FOR_RESUME,
	START_ATTEMPT_FAILED,
	RESUME_ATTEMPT_FAILED,
	SENDING_RESPONSES,
	SEND_RESPONSES_SUCCESSFUL,
	SEND_RESPONSES_FAILED,
	ENDING_ATTEMPT,
	END_ATTEMPT_FAILED,
	END_ATTEMPT_SUCCESSFUL,
	PROMPTING_FOR_IMPORT,
	IMPORT_ATTEMPT_FAILED,
	FETCH_HISTORY_FAILED
} = AssessmentMachineStates

const {
	NO_ATTEMPT,
	NO_QUESTIONS,
	UNKNOWN,
	HAS_RESPONSES_WITH_UNKNOWN_SEND_STATES,
	HAS_QUESTIONS_UNANSWERED,
	HAS_QUESTIONS_EMPTY,
	HAS_RESPONSES_UNSENT,
	READY_TO_SUBMIT
} = CurrentAssessmentStates

jest.mock('obojobo-document-engine/src/scripts/viewer', () => ({
	...jest.requireActual('obojobo-document-engine/src/scripts/viewer').default,
	util: {
		...jest.requireActual('obojobo-document-engine/src/scripts/viewer').default.util,
		NavUtil: {
			getNavLabelForModel: () => 'mock-nav-label'
		}
	}
}))

jest.mock('./assessment-score-reporter')
AssessmentScoreReporter.mockImplementation(() => ({
	getReportFor: jest.fn()
}))

jest.mock('./assessment-score-report-view')
AssessmentScoreReportView.mockImplementation(() => <div>mockAssessmentScoreReportView</div>)

describe('AssessmentDialog renders as expected', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test.each`
		assessmentMachineState       | assessmentError                         | currentAttemptStatus                      | numAttemptsRemaining
		${PROMPTING_FOR_RESUME}      | ${null}                                 | ${null}                                   | ${null}
		${PROMPTING_FOR_IMPORT}      | ${null}                                 | ${null}                                   | ${null}
		${SEND_RESPONSES_FAILED}     | ${null}                                 | ${null}                                   | ${null}
		${ENDING_ATTEMPT}            | ${null}                                 | ${null}                                   | ${null}
		${SENDING_RESPONSES}         | ${null}                                 | ${null}                                   | ${null}
		${START_ATTEMPT_FAILED}      | ${'attempt limit reached'}              | ${null}                                   | ${null}
		${START_ATTEMPT_FAILED}      | ${'import score has already been used'} | ${null}                                   | ${null}
		${START_ATTEMPT_FAILED}      | ${'some other error'}                   | ${null}                                   | ${null}
		${RESUME_ATTEMPT_FAILED}     | ${null}                                 | ${null}                                   | ${null}
		${END_ATTEMPT_SUCCESSFUL}    | ${null}                                 | ${null}                                   | ${null}
		${END_ATTEMPT_FAILED}        | ${null}                                 | ${null}                                   | ${null}
		${END_ATTEMPT_FAILED}        | ${ERROR_INVALID_ATTEMPT_END}            | ${null}                                   | ${null}
		${IMPORT_ATTEMPT_FAILED}     | ${null}                                 | ${null}                                   | ${null}
		${FETCH_HISTORY_FAILED}      | ${null}                                 | ${null}                                   | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${NO_ATTEMPT}                             | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${NO_QUESTIONS}                           | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${UNKNOWN}                                | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${HAS_RESPONSES_WITH_UNKNOWN_SEND_STATES} | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${HAS_QUESTIONS_UNANSWERED}               | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${HAS_QUESTIONS_EMPTY}                    | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${HAS_RESPONSES_UNSENT}                   | ${null}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${READY_TO_SUBMIT}                        | ${1}
		${SEND_RESPONSES_SUCCESSFUL} | ${null}                                 | ${READY_TO_SUBMIT}                        | ${10}
		${'someInvalidState'}        | ${null}                                 | ${null}                                   | ${null}
	`(
		'AssessmentDialog(assessmentMachineState="$assessmentMachineState",assessmentError="$assessmentError",currentAttemptStatus="$currentAttemptStatus",numAttemptsRemaining="$numAttemptsRemaining") renders as expected',
		({ assessmentMachineState, assessmentError, currentAttemptStatus, numAttemptsRemaining }) => {
			const props = {
				assessmentMachineState,
				currentAttemptStatus,
				assessment: {
					current: { error: assessmentError },
					attempts: [{ attemptNumber: 1 }]
				},
				assessmentModel: {
					modelState: {
						rubric: {
							toObject: jest.fn()
						}
					}
				},
				numAttemptsRemaining
			}
			const component = renderer.create(<AssessmentDialog {...props} />)
			const tree = component.toJSON()
			expect(tree).toMatchSnapshot()
		}
	)

	test('PROMPTING_FOR_RESUME: Clicking OK calls AssessmentUtil.resumeAttempt', () => {
		const props = {
			assessmentMachineState: PROMPTING_FOR_RESUME,
			assessmentModel: jest.fn()
		}
		const spy = jest.spyOn(AssessmentUtil, 'resumeAttempt').mockReturnValue({})

		expect(AssessmentUtil.resumeAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.resumeAttempt).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('PROMPTING_FOR_IMPORT: onChoice calls importAttempt and abandonImport', () => {
		const props = {
			assessmentMachineState: PROMPTING_FOR_IMPORT,
			assessmentModel: jest.fn(),
			importableScore: 100
		}
		const importSpy = jest.spyOn(AssessmentUtil, 'importAttempt').mockReturnValue({})
		const abandonSpy = jest.spyOn(AssessmentUtil, 'abandonImport').mockReturnValue({})

		expect(AssessmentUtil.importAttempt).not.toHaveBeenCalled()
		expect(AssessmentUtil.abandonImport).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const [importButton, abandonButton] = component.root.findAllByType('button')

		importButton.props.onClick()
		expect(AssessmentUtil.importAttempt).toHaveBeenCalledWith(props.assessmentModel)
		expect(AssessmentUtil.abandonImport).not.toHaveBeenCalled()

		abandonButton.props.onClick()
		expect(AssessmentUtil.importAttempt).toHaveBeenCalledWith(props.assessmentModel)
		expect(AssessmentUtil.abandonImport).toHaveBeenCalledWith(props.assessmentModel)

		importSpy.mockRestore()
		abandonSpy.mockRestore()
	})

	test('SEND_RESPONSES_FAILED: onConfirm continues the attempt', () => {
		const props = {
			assessmentMachineState: SEND_RESPONSES_FAILED,
			assessmentModel: jest.fn()
		}
		const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.continueAttempt).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('START_ATTEMPT_FAILED when attempt limit reached, clicking OK calls expected method', () => {
		const props = {
			assessmentMachineState: START_ATTEMPT_FAILED,
			assessmentModel: jest.fn(),
			assessment: {
				current: {
					error: 'attempt limit reached'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeStartAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeStartAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeStartAttemptFailed).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('START_ATTEMPT_FAILED when import score has already been used, clicking OK calls expected method', () => {
		const props = {
			assessmentMachineState: START_ATTEMPT_FAILED,
			assessmentModel: jest.fn(),
			assessment: {
				current: {
					error: 'import score has already been used'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeStartAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeStartAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeStartAttemptFailed).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('START_ATTEMPT_FAILED with some other error, clicking OK calls expected method', () => {
		const props = {
			assessmentMachineState: START_ATTEMPT_FAILED,
			assessmentModel: jest.fn(),
			assessment: {
				current: {
					error: 'some error'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeStartAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeStartAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeStartAttemptFailed).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('RESUME_ATTEMPT_FAILED, clicking ok acknowledges resume attempt failed', () => {
		const props = {
			assessmentMachineState: RESUME_ATTEMPT_FAILED,
			assessment: {
				current: {
					error: 'some error'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeResumeAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeResumeAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeResumeAttemptFailed).toHaveBeenCalledWith(
			props.assessmentModel
		)

		spy.mockRestore()
	})

	test('END_ATTEMPT_FAILED with ERROR_INVALID_ATTEMPT_END error, clicking onClose acknowledges', () => {
		const props = {
			assessmentMachineState: END_ATTEMPT_FAILED,
			assessment: {
				current: {
					error: ERROR_INVALID_ATTEMPT_END
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeEndAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeEndAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findAllByType('button')[0]
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeEndAttemptFailed).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('END_ATTEMPT_FAILED with ERROR_INVALID_ATTEMPT_END error, clicking onRestart starts new attempt', () => {
		const props = {
			assessmentMachineState: END_ATTEMPT_FAILED,
			assessment: {
				current: {
					error: ERROR_INVALID_ATTEMPT_END
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'startAttempt').mockReturnValue({})

		expect(AssessmentUtil.startAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findAllByType('button')[1]
		button.props.onClick()

		expect(AssessmentUtil.startAttempt).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('END_ATTEMPT_SUCCESSFUL, clicking ok closes the dialog', () => {
		const props = {
			assessmentMachineState: END_ATTEMPT_SUCCESSFUL,
			assessment: {
				current: {
					error: 'some error'
				},
				attempts: [{ attemptNumber: 1 }]
			},
			assessmentModel: {
				modelState: {
					rubric: {
						toObject: jest.fn()
					}
				}
			}
		}
		const acknowledgeEndAttemptSuccessfulSpy = jest
			.spyOn(AssessmentUtil, 'acknowledgeEndAttemptSuccessful')
			.mockReturnValue({})
		const modalUtilHide = jest.spyOn(ModalUtil, 'hide').mockReturnValue({})
		const focusUtilFocusOnNavTargetSpy = jest
			.spyOn(FocusUtil, 'focusOnNavTarget')
			.mockReturnValue({})

		expect(AssessmentUtil.acknowledgeEndAttemptSuccessful).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeEndAttemptSuccessful).toHaveBeenCalledWith(
			props.assessmentModel
		)
		expect(modalUtilHide).toHaveBeenCalled()
		expect(focusUtilFocusOnNavTargetSpy).toHaveBeenCalled()

		acknowledgeEndAttemptSuccessfulSpy.mockRestore()
		modalUtilHide.mockRestore()
		focusUtilFocusOnNavTargetSpy.mockRestore()
	})

	test('END_ATTEMPT_FAILED: clicking OK calls acknowledgeEndAttemptFailed', () => {
		const props = {
			assessmentMachineState: END_ATTEMPT_FAILED,
			assessmentModel: jest.fn(),
			assessment: {
				current: {
					error: 'some error'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeEndAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeEndAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeEndAttemptFailed).toHaveBeenCalledWith(props.assessmentModel)

		spy.mockRestore()
	})

	test('IMPORT_ATTEMPT_FAILED: clicking OK calls acknowledgeImportAttemptFailed', () => {
		const props = {
			assessmentMachineState: IMPORT_ATTEMPT_FAILED,
			assessmentModel: jest.fn(),
			assessment: {
				current: {
					error: 'some error'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeImportAttemptFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeImportAttemptFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const button = component.root.findByType('button')
		button.props.onClick()

		expect(AssessmentUtil.acknowledgeImportAttemptFailed).toHaveBeenCalledWith(
			props.assessmentModel
		)

		spy.mockRestore()
	})

	test('FETCH_HISTORY_FAILED: clicking buttons calls expected methods', () => {
		const props = {
			assessmentMachineState: FETCH_HISTORY_FAILED,
			assessmentModel: jest.fn(),
			assessment: {
				current: {
					error: 'some error'
				}
			}
		}
		const spy = jest.spyOn(AssessmentUtil, 'acknowledgeFetchHistoryFailed').mockReturnValue({})

		expect(AssessmentUtil.acknowledgeFetchHistoryFailed).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const [closeButton, tryAgainButton] = component.root.findAllByType('button')

		closeButton.props.onClick()
		expect(AssessmentUtil.acknowledgeFetchHistoryFailed).toHaveBeenLastCalledWith(
			props.assessmentModel,
			false
		)

		tryAgainButton.props.onClick()
		expect(AssessmentUtil.acknowledgeFetchHistoryFailed).toHaveBeenLastCalledWith(
			props.assessmentModel,
			true
		)

		spy.mockRestore()
	})

	test.each`
		currentAttemptStatus
		${NO_ATTEMPT}
		${NO_QUESTIONS}
		${UNKNOWN}
		${HAS_RESPONSES_WITH_UNKNOWN_SEND_STATES}
	`(
		'SEND_RESPONSES_SUCCESSFUL, "$currentAttemptStatus": clicking OK calls continueAttempt',
		({ currentAttemptStatus }) => {
			const props = {
				assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
				currentAttemptStatus,
				assessmentModel: jest.fn()
			}
			const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})

			expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()

			const component = renderer.create(<AssessmentDialog {...props} />)
			const button = component.root.findByType('button')
			button.props.onClick()

			expect(AssessmentUtil.continueAttempt).toHaveBeenCalledWith(props.assessmentModel)

			spy.mockRestore()
		}
	)

	test.each`
		currentAttemptStatus
		${HAS_QUESTIONS_UNANSWERED}
		${HAS_QUESTIONS_EMPTY}
		${HAS_RESPONSES_UNSENT}
	`(
		'SEND_RESPONSES_SUCCESSFUL, "$currentAttemptStatus": clicking resume calls continueAttempt',
		({ currentAttemptStatus }) => {
			const props = {
				assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
				currentAttemptStatus,
				assessmentModel: jest.fn(),
				endAttempt: jest.fn()
			}
			const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})
			const modalUtilHideSpy = jest.spyOn(ModalUtil, 'hide').mockReturnValue({})

			expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
			expect(props.endAttempt).not.toHaveBeenCalled()

			const component = renderer.create(<AssessmentDialog {...props} />)
			const [, resumeButton] = component.root.findAllByType('button')
			resumeButton.props.onClick()

			expect(AssessmentUtil.continueAttempt).toHaveBeenCalledWith(props.assessmentModel)
			expect(props.endAttempt).not.toHaveBeenCalled()

			spy.mockRestore()
			modalUtilHideSpy.mockRestore()
		}
	)

	test.each`
		currentAttemptStatus
		${HAS_QUESTIONS_UNANSWERED}
		${HAS_QUESTIONS_EMPTY}
		${HAS_RESPONSES_UNSENT}
	`(
		'SEND_RESPONSES_SUCCESSFUL, "$currentAttemptStatus": clicking submit calls continueAttempt',
		({ currentAttemptStatus }) => {
			const props = {
				assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
				currentAttemptStatus,
				assessmentModel: jest.fn(),
				endAttempt: jest.fn()
			}
			const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})
			const modalUtilHideSpy = jest.spyOn(ModalUtil, 'hide').mockReturnValue({})

			expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
			expect(props.endAttempt).not.toHaveBeenCalled()

			const component = renderer.create(<AssessmentDialog {...props} />)
			const [submitButton] = component.root.findAllByType('button')
			submitButton.props.onClick()

			expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
			expect(props.endAttempt).toHaveBeenCalled()

			spy.mockRestore()
			modalUtilHideSpy.mockRestore()
		}
	)

	test('SEND_RESPONSES_SUCCESSFUL, READY_TO_SUBMIT, 1 attempt remaining, clicking cancel continues attempt', () => {
		const props = {
			assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
			currentAttemptStatus: READY_TO_SUBMIT,
			assessmentModel: jest.fn(),
			endAttempt: jest.fn(),
			numAttemptsRemaining: 1
		}
		const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
		expect(props.endAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const [cancelButton] = component.root.findAllByType('button')
		cancelButton.props.onClick()

		expect(AssessmentUtil.continueAttempt).toHaveBeenCalledWith(props.assessmentModel)
		expect(props.endAttempt).not.toHaveBeenCalled()

		spy.mockRestore()
	})

	test('SEND_RESPONSES_SUCCESSFUL, READY_TO_SUBMIT, 1 attempt remaining, clicking OK calls endAttempt', () => {
		const props = {
			assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
			currentAttemptStatus: READY_TO_SUBMIT,
			assessmentModel: jest.fn(),
			endAttempt: jest.fn(),
			numAttemptsRemaining: 1
		}
		const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
		expect(props.endAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const [, okButton] = component.root.findAllByType('button')
		okButton.props.onClick()

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
		expect(props.endAttempt).toHaveBeenCalled()

		spy.mockRestore()
	})

	test('SEND_RESPONSES_SUCCESSFUL, READY_TO_SUBMIT, > 1 attempt remaining, clicking cancel continues attempt', () => {
		const props = {
			assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
			currentAttemptStatus: READY_TO_SUBMIT,
			assessmentModel: jest.fn(),
			endAttempt: jest.fn(),
			numAttemptsRemaining: 10
		}
		const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
		expect(props.endAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const [cancelButton] = component.root.findAllByType('button')
		cancelButton.props.onClick()

		expect(AssessmentUtil.continueAttempt).toHaveBeenCalledWith(props.assessmentModel)
		expect(props.endAttempt).not.toHaveBeenCalled()

		spy.mockRestore()
	})

	test('SEND_RESPONSES_SUCCESSFUL, READY_TO_SUBMIT, > 1 attempt remaining, clicking OK calls endAttempt', () => {
		const props = {
			assessmentMachineState: SEND_RESPONSES_SUCCESSFUL,
			currentAttemptStatus: READY_TO_SUBMIT,
			assessmentModel: jest.fn(),
			endAttempt: jest.fn(),
			numAttemptsRemaining: 10
		}
		const spy = jest.spyOn(AssessmentUtil, 'continueAttempt').mockReturnValue({})

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
		expect(props.endAttempt).not.toHaveBeenCalled()

		const component = renderer.create(<AssessmentDialog {...props} />)
		const [, okButton] = component.root.findAllByType('button')
		okButton.props.onClick()

		expect(AssessmentUtil.continueAttempt).not.toHaveBeenCalled()
		expect(props.endAttempt).toHaveBeenCalled()

		spy.mockRestore()
	})
})
