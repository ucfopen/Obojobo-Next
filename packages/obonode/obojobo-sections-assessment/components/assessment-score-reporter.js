import getScoreComparisonData from './assessment-score-reporter/get-score-comparison-data'
import getReportDetailsForAttempt from './assessment-score-reporter/get-report-details-for-attempt'
import getReportDisplayValuesForAttempt from './assessment-score-reporter/get-report-display-values-for-attempt'
import getScoreChangeDescription from './assessment-score-reporter/get-score-change-description'
import getTextItems from './assessment-score-reporter/get-text-items'

class AssessmentScoreReporter {
	constructor({ assessmentRubric, allScoreDetails, totalNumberOfAttemptsAllowed }) {
		this.assessmentRubric = assessmentRubric
		this.totalNumberOfAttemptsAllowed = totalNumberOfAttemptsAllowed
		this.allScoreDetails = allScoreDetails
	}

	getReportFor(attemptNumber) {
		if (attemptNumber === 0) {
			throw new Error('getReportFor parameter is not zero-indexed - Use "1" for first attempt.')
		}

		const assessScoreInfoToReport = this.allScoreDetails[attemptNumber - 1]

		if (!assessScoreInfoToReport || !assessScoreInfoToReport.status) {
			throw new Error(`Error, score details for attempt ${attemptNumber} were not loaded.`)
		}

		return {
			textItems: getTextItems(
				getReportDetailsForAttempt(this.assessmentRubric, assessScoreInfoToReport),
				getReportDisplayValuesForAttempt(assessScoreInfoToReport, this.totalNumberOfAttemptsAllowed)
			),
			scoreChangeDescription: getScoreChangeDescription(
				getScoreComparisonData(this.allScoreDetails, attemptNumber)
			)
		}
	}
}

export default AssessmentScoreReporter
