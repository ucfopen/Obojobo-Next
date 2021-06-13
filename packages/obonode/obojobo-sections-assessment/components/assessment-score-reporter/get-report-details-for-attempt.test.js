import getReportDetailsForAttempt from './get-report-details-for-attempt'

jest.mock('./get-status-result', () => {
	return () => 'mocked-status-result'
})

describe('getReportDetailsForAttempt', () => {
	test('returns expected data structure', () => {
		expect(
			getReportDetailsForAttempt(
				{
					type: 'rubric-type',
					mods: [],
					passingAttemptScore: 50
				},
				{
					status: 'passed',
					attemptNumber: 1,
					attemptScore: 100,
					rewardedMods: [],
					assessmentScore: 100,
					rewardTotal: 0,
					assessmentModdedScore: 100
				}
			)
		).toEqual({
			rubricType: 'rubric-type',
			mods: [],
			status: 'passed',
			statusResult: 'mocked-status-result',
			isAttemptScore100: true,
			isAssessScoreOver100: false,
			passingAttemptScore: 50
		})
	})

	test('mods property is a map of rewarded mods', () => {
		expect(
			getReportDetailsForAttempt(
				{
					type: 'rubric-type',
					mods: ['mod-0', 'mod-1', 'mod-2']
				},
				{
					rewardedMods: [0, 2]
				}
			).mods
		).toEqual(['mod-0', 'mod-2'])
	})

	test('isAttemptScore100 works', () => {
		expect(
			getReportDetailsForAttempt(
				{
					mods: []
				},
				{
					rewardedMods: [],
					attemptScore: 99
				}
			).isAttemptScore100
		).toBe(false)

		expect(
			getReportDetailsForAttempt(
				{
					mods: []
				},
				{
					rewardedMods: [],
					attemptScore: 100
				}
			).isAttemptScore100
		).toBe(true)
	})
})
