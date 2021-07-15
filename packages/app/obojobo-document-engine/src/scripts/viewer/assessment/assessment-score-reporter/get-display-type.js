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
} from './display-types'

const getDisplayType = ({ rubricType, mods, status, statusResult, isAttemptScore100 }) => {
	const passed = status === 'passed'
	const failed = status === 'failed'
	const unableToPass = status === 'unableToPass'
	const isAttemptRubric = rubricType === 'attempt'
	const isPassFailRubric = rubricType === 'pass-fail'
	const isRewardedMods = mods.length > 0
	const isResult100 = parseFloat(statusResult) === 100
	const isResultNumeric = Number.isFinite(parseFloat(statusResult))
	const isResultNoScore = statusResult === 'no-score'
	const isResultAttemptScore = statusResult === '$attempt_score'
	const isResultHighestAttemptScore = statusResult === '$highest_attempt_score'

	if (isAttemptRubric && passed && isResultAttemptScore && !isRewardedMods) {
		return TYPE_ATTEMPT_WITHOUT_MODS_REWARDED
	}
	if (isAttemptRubric && passed && isResultAttemptScore && isRewardedMods) {
		return TYPE_ATTEMPT_WITH_MODS_REWARDED
	}
	if (isPassFailRubric && passed && isResultAttemptScore && !isRewardedMods) {
		return TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED
	}
	if (isPassFailRubric && passed && isResultAttemptScore && isRewardedMods) {
		return TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED
	}
	if (isPassFailRubric && passed & isResultNumeric && isAttemptScore100 && !isResult100) {
		return TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_RESULT_IS_LESS_THAN_100
	}
	if (isPassFailRubric && passed && isResultNumeric) {
		return TYPE_PASSFAIL_PASSED_GIVEN_SCORE
	}
	if (isPassFailRubric && failed && isResultAttemptScore && !isRewardedMods) {
		return TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE
	}
	if (isPassFailRubric && failed && isResultNoScore && !isRewardedMods) {
		return TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE
	}
	if (isPassFailRubric && failed && isResultNumeric && !isRewardedMods) {
		return TYPE_PASSFAIL_FAILED_GIVEN_SCORE
	}
	if (isPassFailRubric && unableToPass && isResultNoScore && !isRewardedMods) {
		return TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE
	}
	if (isPassFailRubric && unableToPass && isResultHighestAttemptScore && !isRewardedMods) {
		return TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE
	}
	if (isPassFailRubric && unableToPass && isResultNumeric && !isRewardedMods) {
		return TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE
	}

	return ERROR_UNKNOWN_DISPLAY_TYPE
}

export default getDisplayType
