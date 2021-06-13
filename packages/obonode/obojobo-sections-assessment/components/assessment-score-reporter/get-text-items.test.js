import getTextItems from './get-text-items'
import {
	TYPE_ATTEMPT_WITHOUT_MODS_REWARDED,
	TYPE_ATTEMPT_WITH_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100,
	TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_NO_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_MODS_REWARDED,
	TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE,
	TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE,
	TYPE_PASSFAIL_FAILED_GIVEN_SCORE,
	TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE,
	TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE,
	TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE,
	ERROR_UNKNOWN_DISPLAY_TYPE
} from './display-types'

const getDisplayType = require('./get-display-type').default

jest.mock('./get-display-type')

describe('getTextItems', () => {
	const mods = [
		{
			attemptCondition: '1',
			reward: '5'
		}
	]

	const displayValues = {
		passingAttemptScore: 'PassingAttemptScore',
		attemptNum: 'AttemptNumber',
		attemptScore: 'AttemptScore',
		assessScore: 'AssessmentScore',
		totalNumberOfAttemptsAllowed: 'TotalAttempts'
	}

	test('TYPE_ATTEMPT_WITHOUT_MODS_REWARDED', () => {
		getDisplayType.mockReturnValueOnce(TYPE_ATTEMPT_WITHOUT_MODS_REWARDED)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(TYPE_ATTEMPT_WITHOUT_MODS_REWARDED)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_ATTEMPT_WITH_MODS_REWARDED', () => {
		getDisplayType.mockReturnValueOnce(TYPE_ATTEMPT_WITH_MODS_REWARDED)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score (Max 100%)',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(TYPE_ATTEMPT_WITH_MODS_REWARDED)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED', () => {
		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score (Max 100%)',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100 (Without mods)', () => {
		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods: [],
					statusResult: 100
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score (Passed)',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'value',
				text: 'Score adjusted for passing',
				value: '100'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score (Max 100%)',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods: [],
					statusResult: 100
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score (Passed)',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'value',
				text: 'Score adjusted for passing',
				value: '100'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100 (With mods)', () => {
		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods,
					statusResult: 100
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score (Passed)',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'value',
				text: 'Score adjusted for passing',
				value: '100'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score (Max 100%)',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods,
					statusResult: 100
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score (Passed)',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'value',
				text: 'Score adjusted for passing',
				value: '100'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_NO_MODS_REWARDED', () => {
		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_NO_MODS_REWARDED
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_NO_MODS_REWARDED
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_MODS_REWARDED (With mods)', () => {
		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_MODS_REWARDED
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: true,
					mods,
					statusResult: 100
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score (Passed)',
				value: 'AttemptScore'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score (Max 100%)',
				value: 'AssessmentScore'
			}
		])

		getDisplayType.mockReturnValueOnce(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_MODS_REWARDED
		)
		expect(
			getTextItems(
				{
					isAssessScoreOver100: false,
					mods,
					statusResult: 100
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score (Passed)',
				value: 'AttemptScore'
			},
			{
				type: 'extra-credit',
				text: 'Passed on first attempt',
				value: '5'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: 50,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text: 'You need 50% or higher to pass'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: 50,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text: 'You need 50% or higher to pass'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_FAILED_GIVEN_SCORE', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_FAILED_GIVEN_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: 50,
					statusResult: 0,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'value',
				text: 'Score adjusted for not passing (less than 50%)',
				value: '0'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: 50,
					statusResult: 0,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text: 'You needed 50% or higher to pass'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE with 100% needed', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: '100',
					statusResult: 0,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text: 'You needed 100% to pass'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE with null needed', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: null,
					statusResult: 0,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text: 'You needed --% or higher to pass'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: 50,
					statusResult: 0,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text:
					'You did not achieve a passing 50% or higher score within the number of attempts available. Your highest attempt score will be used instead.'
			},
			{
				type: 'divider'
			},
			{
				type: 'value',
				text: 'Highest attempt score (Attempt\u00a0AttemptNumber)',
				value: 'AssessmentScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE', () => {
		getDisplayType.mockReturnValueOnce(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE)
		expect(
			getTextItems(
				{
					passingAttemptScore: 50,
					statusResult: 0,
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'value',
				text: 'Attempt Score',
				value: 'AttemptScore'
			},
			{
				type: 'divider'
			},
			{
				type: 'text',
				text:
					'You did not achieve a passing 50% or higher score within the number of attempts available.'
			},
			{
				type: 'value',
				text: 'Score for not achieving a passing attempt',
				value: '0'
			},
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score',
				value: 'AssessmentScore'
			}
		])
	})

	test('ERROR_UNKNOWN_DISPLAY_TYPE still shows score', () => {
		getDisplayType.mockReturnValueOnce(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(
			getTextItems(
				{
					mods: []
				},
				displayValues
			)
		).toEqual([
			{
				type: 'total',
				text: 'Score',
				value: 'AssessmentScore'
			}
		])
	})
})
