import AssessmentRubric from '../../assessment-rubric'
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

const getDisplayType = ({ rubricType, mods, status, statusResult, isAttemptScore100 }) => {
	const passed = status === AssessmentRubric.STATUS_PASSED
	const failed = status === AssessmentRubric.STATUS_FAILED
	const unableToPass = status === AssessmentRubric.STATUS_UNABLE_TO_PASS
	const isAttemptRubric = rubricType === AssessmentRubric.TYPE_ATTEMPT
	const isPassFailRubric = rubricType === AssessmentRubric.TYPE_PASS_FAIL
	const isRewardedMods = mods.length > 0
	const isResultNumeric = Number.isFinite(parseFloat(statusResult))
	const isResultNoScore = statusResult === AssessmentRubric.NO_SCORE
	const isResultAttemptScore = statusResult === AssessmentRubric.VAR_ATTEMPT_SCORE
	const isResultHighestAttemptScore = statusResult === AssessmentRubric.VAR_HIGHEST_ATTEMPT_SCORE

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
	if (isPassFailRubric && passed && isResultNumeric && !isAttemptScore100) {
		return TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_LESS_THAN_100
	}
	if (isPassFailRubric && passed && isResultNumeric && isAttemptScore100 && !isRewardedMods) {
		return TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_NO_MODS_REWARDED
	}
	if (isPassFailRubric && passed && isResultNumeric && isAttemptScore100 && isRewardedMods) {
		return TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_MODS_REWARDED
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
