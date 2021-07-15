import getDisplayFriendlyScore from './get-display-friendly-score'
import getTextItemsForMods from './get-text-items-for-mods'
import getDisplayType from './get-display-type'

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

const getPassingRange = passingNumber => {
	if (passingNumber === '100') return '100%'
	return getDisplayFriendlyScore(passingNumber) + '% or higher'
}

const getTextItems = (
	{
		rubricType,
		mods,
		status,
		statusResult,
		passingAttemptScore,
		isAttemptScore100,
		isAssessScoreOver100
	},
	{ attemptNum, attemptScore, assessScore, totalNumberOfAttemptsAllowed }
) => {
	let items = []

	switch (
		getDisplayType({
			rubricType,
			mods,
			status,
			statusResult,
			isAttemptScore100
		})
	) {
		case TYPE_ATTEMPT_WITHOUT_MODS_REWARDED:
		case TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITHOUT_MODS_REWARDED:
		case ERROR_UNKNOWN_DISPLAY_TYPE: // Shouldn't get here but we still want to show their score
			items.push({
				type: 'total',
				text: 'Score',
				value: assessScore
			})
			break

		case TYPE_ATTEMPT_WITH_MODS_REWARDED:
		case TYPE_PASSFAIL_PASSED_GIVEN_ATTEMPT_SCORE_WITH_MODS_REWARDED:
			items.push({
				type: 'value',
				text: 'Attempt Score',
				value: attemptScore
			})
			break

		case TYPE_PASSFAIL_PASSED_GIVEN_SCORE_AND_ATTEMPT_SCORE_IS_100_AND_RESULT_IS_LESS_THAN_100:
		case TYPE_PASSFAIL_PASSED_GIVEN_SCORE:
			items.push(
				{
					type: 'value',
					text: 'Attempt Score (Passed)',
					value: attemptScore
				},
				{
					type: 'divider'
				},
				{
					type: 'value',
					text: 'Score adjusted for passing',
					value: getDisplayFriendlyScore(statusResult)
				}
			)
			break

		case TYPE_PASSFAIL_FAILED_GIVEN_ATTEMPT_SCORE:
		case TYPE_PASSFAIL_FAILED_GIVEN_NO_SCORE:
			items.push(
				{
					type: 'value',
					text: 'Attempt Score',
					value: attemptScore
				},
				{
					type: 'divider'
				},
				{
					type: 'text',
					text: 'You need ' + getPassingRange(passingAttemptScore) + ' to pass'
				}
			)
			break

		case TYPE_PASSFAIL_FAILED_GIVEN_SCORE:
			items.push(
				{
					type: 'value',
					text: 'Attempt Score',
					value: attemptScore
				},
				{
					type: 'divider'
				},
				{
					type: 'value',
					text:
						'Score adjusted for not passing (less than ' +
						getDisplayFriendlyScore(passingAttemptScore) +
						'%)',
					value: getDisplayFriendlyScore(statusResult)
				}
			)
			break

		case TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_NO_SCORE:
			items.push(
				{
					type: 'value',
					text: 'Attempt Score',
					value: attemptScore
				},
				{
					type: 'divider'
				},
				{
					type: 'text',
					text: 'You needed ' + getPassingRange(passingAttemptScore) + ' to pass'
				}
			)
			break

		case TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_HIGHEST_ATTEMPT_SCORE:
			items.push(
				{
					type: 'value',
					text: 'Attempt Score',
					value: attemptScore
				},
				{
					type: 'divider'
				},
				{
					type: 'text',
					text:
						'You did not achieve a passing ' +
						getPassingRange(passingAttemptScore) +
						' score within the number of attempts available. Your highest attempt score will be used instead.'
				},
				{
					type: 'divider'
				},
				{
					type: 'value',
					text: 'Highest attempt score (Attempt\u00a0' + attemptNum + ')',
					value: assessScore
				}
			)
			break

		case TYPE_PASSFAIL_UNABLE_TO_PASS_GIVEN_SCORE:
			items.push(
				{
					type: 'value',
					text: 'Attempt Score',
					value: attemptScore
				},
				{
					type: 'divider'
				},
				{
					type: 'text',
					text:
						'You did not achieve a passing ' +
						getPassingRange(passingAttemptScore) +
						' score within the number of attempts available.'
				},
				{
					type: 'value',
					text: 'Score for not achieving a passing attempt',
					value: getDisplayFriendlyScore(statusResult)
				}
			)
			break
	}

	items = items.concat(getTextItemsForMods(mods, totalNumberOfAttemptsAllowed))

	if (items.length > 1) {
		items.push(
			{
				type: 'divider'
			},
			{
				type: 'total',
				text: 'Total Score' + (isAssessScoreOver100 ? ' (Max 100%)' : ''),
				// value: assessScore === null ? 'Did Not Pass' : assessScore
				value: assessScore
			}
		)
	}

	return items
}

export default getTextItems
