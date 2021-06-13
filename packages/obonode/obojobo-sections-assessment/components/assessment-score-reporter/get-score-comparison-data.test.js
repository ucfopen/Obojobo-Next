import getScoreComparisonData from './get-score-comparison-data'

describe('getScoreChangeData', () => {
	test('returns when requesting the last item when theres only one', () => {
		const scoreDetails = [{ assessmentScore: 10 }]

		const result = getScoreComparisonData(scoreDetails, 1)
		expect(result).toHaveProperty('newInfo', scoreDetails[0])
		expect(result).toHaveProperty('prevHighestInfo', null)
	})

	test('returns when requesting an attempt number that doesnt exist', () => {
		const scoreDetails = [{ assessmentScore: 10 }, { assessmentScore: 20 }]

		const result = getScoreComparisonData(scoreDetails, 50)
		expect(result).toHaveProperty('newInfo', undefined) //eslint-disable-line no-undefined
		expect(result).toHaveProperty('prevHighestInfo', scoreDetails[1])
	})

	test('Returns when previous score is lower then newest ', () => {
		const scoreDetails = [{ assessmentScore: 10 }, { assessmentScore: 20 }]

		const result = getScoreComparisonData(scoreDetails, 2)
		expect(result).toHaveProperty('newInfo', scoreDetails[1])
		expect(result).toHaveProperty('prevHighestInfo', scoreDetails[0])
	})

	test('Returns when there are two with the same max score', () => {
		const scoreDetails = [
			{ assessmentScore: 10 },
			{ assessmentScore: 30 },
			{ assessmentScore: 30 },
			{ assessmentScore: 20 }
		]

		const result = getScoreComparisonData(scoreDetails, 4)
		expect(result).toHaveProperty('newInfo', scoreDetails[3])
		expect(result).toHaveProperty('prevHighestInfo')
		expect(result.prevHighestInfo).toBe(scoreDetails[2]) // specifically expect the last max score
	})

	test('Handles case with no attempts', () => {
		const result = getScoreComparisonData([], 2)
		expect(result).toEqual({
			prevHighestInfo: null,
			newInfo: null
		})
	})
})
