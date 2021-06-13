import getScoreChangeDescription from './get-score-change-description'

describe('getScoreChangeDescription', () => {
	test('Returns correct description', () => {
		expect(
			getScoreChangeDescription({
				prevHighestInfo: null,
				newInfo: null
			})
		).toBe(null)

		expect(
			getScoreChangeDescription({
				prevHighestInfo: { assessmentModdedScore: null },
				newInfo: { assessmentModdedScore: null }
			})
		).toBe('This did not change your recorded score')

		expect(
			getScoreChangeDescription({
				prevHighestInfo: { assessmentModdedScore: null },
				newInfo: { assessmentModdedScore: 100 }
			})
		).toBe('✔ Your recorded score was updated to 100%')

		expect(
			getScoreChangeDescription({
				prevHighestInfo: { assessmentModdedScore: 99 },
				newInfo: { assessmentModdedScore: 100 }
			})
		).toBe('✔ Your recorded score was updated from 99% to 100%')

		expect(
			getScoreChangeDescription({
				prevHighestInfo: { assessmentModdedScore: 100 },
				newInfo: { assessmentModdedScore: 100 }
			})
		).toBe('This maintains your recorded score of 100%')

		expect(
			getScoreChangeDescription({
				prevHighestInfo: { assessmentModdedScore: 100 },
				newInfo: { assessmentModdedScore: 99 }
			})
		).toBe('This did not change your recorded score of 100%')

		expect(
			getScoreChangeDescription({
				prevHighestInfo: { assessmentModdedScore: 100 },
				newInfo: { assessmentModdedScore: null }
			})
		).toBe('This did not change your recorded score of 100%')
	})
})
