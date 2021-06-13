import getReportDisplayValuesForAttempt from './get-report-display-values-for-attempt'

describe('getReportDisplayValuesForAttempt', () => {
	test('returns expected data structure', () => {
		expect(
			getReportDisplayValuesForAttempt(
				{
					attemptNumber: 20,
					attemptScore: 30,
					assessmentModdedScore: 40
				},
				50
			)
		).toEqual({
			attemptNum: '20',
			attemptScore: '30',
			assessScore: '40',
			totalNumberOfAttemptsAllowed: '50'
		})
	})

	test('returns default value for passingAttemptScore and assessScore', () => {
		expect(
			getReportDisplayValuesForAttempt(
				{
					attemptNumber: 20,
					attemptScore: 30,
					assessmentModdedScore: null
				},
				50
			)
		).toEqual({
			attemptNum: '20',
			attemptScore: '30',
			assessScore: 'Did Not Pass',
			totalNumberOfAttemptsAllowed: '50'
		})
	})
})
