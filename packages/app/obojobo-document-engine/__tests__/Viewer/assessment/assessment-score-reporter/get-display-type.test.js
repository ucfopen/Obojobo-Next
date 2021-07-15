import {
	TYPE_ATTEMPT_WITHOUT_MODS_REWARDED,
	TYPE_ATTEMPT_WITH_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED,
	TYPE_PASSFAIL_PASSED_GIVEN_SCORE,
	TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_RESULT_IS_LESS_THAN_100,
	TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE,
	TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE,
	TYPE_PASSFAIL_FAILED_GIVEN_SCORE,
	TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE,
	TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE,
	TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE,
	ERROR_UNKNOWN_DISPLAY_TYPE
} from '../../../../src/scripts/viewer/assessment/assessment-score-reporter/display-types.js'
import getDisplayType from '../../../../src/scripts/viewer/assessment/assessment-score-reporter/get-display-type.js'

describe('getDisplayType', () => {
	const tc = (rubricType, status, statusResult, isAttemptScore100, hasMods) => {
		return getDisplayType({
			rubricType,
			status,
			statusResult,
			isAttemptScore100,
			mods: hasMods ? [{ attemptCondition: '1', reward: '5' }] : []
		})
	}

	test('returns expected display types from inputs', () => {
		const p = 'passed'
		const f = 'failed'
		const u = 'unableToPass'
		const attScore = '$attempt_score'
		const highest = '$highest_attempt_score'

		//
		// Attempt type where score < 100 and no mods rewarded
		//
		expect(tc('attempt', p, '100', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, '100', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, '100', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, attScore, 0, 0)).toEqual(TYPE_ATTEMPT_WITHOUT_MODS_REWARDED)
		expect(tc('attempt', f, attScore, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, attScore, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, highest, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, highest, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, highest, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, 'no-score', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, 'no-score', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, 'no-score', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)

		//
		// Attempt type where score === 100 and no mods rewarded
		//
		expect(tc('attempt', p, '100', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, '100', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, '100', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, attScore, 1, 0)).toEqual(TYPE_ATTEMPT_WITHOUT_MODS_REWARDED)
		expect(tc('attempt', f, attScore, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, attScore, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, highest, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, highest, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, highest, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, 'no-score', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, 'no-score', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, 'no-score', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)

		//
		// Attempt type where score < 100 and mods rewarded
		//
		expect(tc('attempt', p, '100', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, '100', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, '100', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, attScore, 0, 1)).toEqual(TYPE_ATTEMPT_WITH_MODS_REWARDED)
		expect(tc('attempt', f, attScore, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, attScore, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, highest, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, highest, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, highest, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, 'no-score', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, 'no-score', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, 'no-score', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)

		//
		// Attempt type where score === 100 and mods rewarded
		//
		expect(tc('attempt', p, '100', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, '100', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, '100', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, attScore, 1, 1)).toEqual(TYPE_ATTEMPT_WITH_MODS_REWARDED)
		expect(tc('attempt', f, attScore, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, attScore, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, highest, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, highest, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, highest, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', p, 'no-score', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', f, 'no-score', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('attempt', u, 'no-score', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)

		//
		// Pass/Fail type where score < 100 and no mods rewarded
		//
		expect(tc('pass-fail', p, '100', 0, 0)).toEqual(TYPE_PASSFAIL_PASSED_GIVEN_SCORE)
		expect(tc('pass-fail', f, '100', 0, 0)).toEqual(TYPE_PASSFAIL_FAILED_GIVEN_SCORE)
		expect(tc('pass-fail', u, '100', 0, 0)).toEqual(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE)
		expect(tc('pass-fail', p, attScore, 0, 0)).toEqual(
			TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED
		)
		expect(tc('pass-fail', f, attScore, 0, 0)).toEqual(TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE)
		expect(tc('pass-fail', u, attScore, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, highest, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, highest, 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, highest, 0, 0)).toEqual(
			TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE
		)
		expect(tc('pass-fail', p, 'no-score', 0, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, 'no-score', 0, 0)).toEqual(TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE)
		expect(tc('pass-fail', u, 'no-score', 0, 0)).toEqual(
			TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE
		)

		//
		// Pass/Fail type where score === 100 and no mods rewarded
		//
		expect(tc('pass-fail', p, '100', 1, 0)).toEqual(TYPE_PASSFAIL_PASSED_GIVEN_SCORE)
		expect(tc('pass-fail', f, '100', 1, 0)).toEqual(TYPE_PASSFAIL_FAILED_GIVEN_SCORE)
		expect(tc('pass-fail', u, '100', 1, 0)).toEqual(TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE)
		expect(tc('pass-fail', p, '90', 1, 0)).toEqual(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_RESULT_IS_LESS_THAN_100
		)
		expect(tc('pass-fail', p, attScore, 1, 0)).toEqual(
			TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED
		)
		expect(tc('pass-fail', f, attScore, 1, 0)).toEqual(TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE)
		expect(tc('pass-fail', u, attScore, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, highest, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, highest, 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, highest, 1, 0)).toEqual(
			TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE
		)
		expect(tc('pass-fail', p, 'no-score', 1, 0)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, 'no-score', 1, 0)).toEqual(TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE)
		expect(tc('pass-fail', u, 'no-score', 1, 0)).toEqual(
			TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE
		)

		//
		// Pass/Fail type where score < 100 and mods rewarded
		//
		expect(tc('pass-fail', p, '100', 0, 1)).toEqual(TYPE_PASSFAIL_PASSED_GIVEN_SCORE)
		expect(tc('pass-fail', f, '100', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, '100', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, attScore, 0, 1)).toEqual(
			TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED
		)
		expect(tc('pass-fail', f, attScore, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, attScore, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, highest, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, highest, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, highest, 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, 'no-score', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, 'no-score', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, 'no-score', 0, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)

		//
		// Pass/Fail type where score === 100 and mods rewarded
		//
		expect(tc('pass-fail', p, '100', 1, 1)).toEqual(TYPE_PASSFAIL_PASSED_GIVEN_SCORE)
		expect(tc('pass-fail', p, '90', 1, 1)).toEqual(
			TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_RESULT_IS_LESS_THAN_100
		)
		expect(tc('pass-fail', f, '100', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, '100', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)

		expect(tc('pass-fail', p, attScore, 1, 1)).toEqual(
			TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED
		)
		expect(tc('pass-fail', f, attScore, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, attScore, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, highest, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, highest, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, highest, 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', p, 'no-score', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', f, 'no-score', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
		expect(tc('pass-fail', u, 'no-score', 1, 1)).toEqual(ERROR_UNKNOWN_DISPLAY_TYPE)
	})
})
