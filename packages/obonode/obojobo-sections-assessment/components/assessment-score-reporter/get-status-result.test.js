import getStatusResult from './get-status-result'

describe('getStatusResult', () => {
	test('passed default is 100', () => {
		expect(getStatusResult({}, 'passed')).toBe(100)
	})

	test('failed default is 0', () => {
		expect(getStatusResult({}, 'failed')).toBe(0)
	})

	test('unableToPass default is 0', () => {
		expect(getStatusResult({}, 'unableToPass')).toBe(0)
	})

	test('passed result is returned', () => {
		expect(
			getStatusResult(
				{
					passedResult: 'passed-result',
					failedResult: 'failed-result',
					unableToPassResult: 'unableToPass-result'
				},
				'passed'
			)
		).toBe('passed-result')
	})

	test('failed result is returned', () => {
		expect(
			getStatusResult(
				{
					passedResult: 'passed-result',
					failedResult: 'failed-result',
					unableToPassResult: 'unableToPass-result'
				},
				'failed'
			)
		).toBe('failed-result')
	})

	test('unableToPass result is returned', () => {
		expect(
			getStatusResult(
				{
					passedResult: 'passed-result',
					failedResult: 'failed-result',
					unableToPassResult: 'unableToPass-result'
				},
				'unableToPass'
			)
		).toBe('unableToPass-result')
	})

	test('unknown status throws error', () => {
		try {
			getStatusResult({}, 'unknown-status')
		} catch (e) {
			expect(e.message).toEqual('Unknown status: unknown-status')
			return
		}

		expect('this').not.toBe('called)')
	})
})
