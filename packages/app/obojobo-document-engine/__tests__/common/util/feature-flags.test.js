import FeatureFlags from '../../../src/scripts/common/util/feature-flags'
import mockConsole from 'jest-mock-console'

describe('FeatureFlags', () => {
	let restoreConsole

	beforeEach(() => {
		restoreConsole = mockConsole('error')
	})

	afterEach(() => {
		FeatureFlags.clearAll()
		restoreConsole()
	})

	test('Constructs as expected', () => {
		expect(FeatureFlags).toMatchSnapshot()
	})

	test('set sets the string value into localStorage', () => {
		expect(window.localStorage['obojobo:flags']).toBeUndefined()
		expect(FeatureFlags.set('mockName', 123)).toBe(true)
		expect(JSON.parse(window.localStorage['obojobo:flags'])).toEqual({ mockName: '123' })
	})

	test('get gets the value from localStorage', () => {
		FeatureFlags.set('mockName', 'mockValue')
		expect(FeatureFlags.get('mockName')).toBe('mockValue')
	})

	test('is returns true if the feature flag at flagName is equal to the given value', () => {
		FeatureFlags.set('mockName', 123)
		expect(FeatureFlags.is('someOtherKey', '123')).toBe(false)
		expect(FeatureFlags.is('mockName', 123)).toBe(true)
		expect(FeatureFlags.is('mockName', '123')).toBe(true)
	})

	test('list returns the contents of all feature flags', () => {
		expect(FeatureFlags.list()).toEqual({})
		FeatureFlags.set('mockName', 'mockValue')
		expect(FeatureFlags.list()).toEqual({ mockName: 'mockValue' })
	})

	test('clear will clear out a feature flag', () => {
		FeatureFlags.set('alpha', '42')
		FeatureFlags.set('beta', '0')
		expect(JSON.parse(window.localStorage['obojobo:flags'])).toEqual({ alpha: '42', beta: '0' })

		FeatureFlags.clear('alpha')
		expect(JSON.parse(window.localStorage['obojobo:flags'])).toEqual({ beta: '0' })
		expect(FeatureFlags.list()).toEqual({ beta: '0' })
	})

	test('clearAll will remove all feature flags', () => {
		FeatureFlags.set('alpha', '42')
		FeatureFlags.set('beta', '0')
		expect(JSON.parse(window.localStorage['obojobo:flags'])).toEqual({ alpha: '42', beta: '0' })

		FeatureFlags.clearAll()
		expect(window.localStorage['obojobo:flags']).toBeUndefined()
		expect(FeatureFlags.list()).toEqual({})
	})

	test('Writing a bad feature flag fails as expected, deletes all flags', () => {
		FeatureFlags.set('alpha', '42')
		FeatureFlags.set('beta', '0')
		expect(JSON.parse(window.localStorage['obojobo:flags'])).toEqual({ alpha: '42', beta: '0' })

		const originalJSON = JSON
		window.JSON = {
			stringify: () => {
				throw 'mockError'
			}
		}

		expect(FeatureFlags.set('gamma', '0')).toBe(false)

		expect(console.error).toHaveBeenCalledWith('Unable to save feature flags: mockError')
		expect(FeatureFlags.list()).toEqual({})
		expect(window.localStorage['obojobo:flags']).toBeUndefined()

		window.JSON = originalJSON
	})

	test('Clearing a flag deletes all flags if there is an error', () => {
		FeatureFlags.set('alpha', '42')
		FeatureFlags.set('beta', '0')

		const originalJSON = JSON
		window.JSON = {
			stringify: () => {
				throw 'mockError'
			}
		}

		expect(FeatureFlags.clear('gamma')).toBe(false)

		expect(console.error).toHaveBeenCalledWith('Unable to save feature flags: mockError')
		expect(FeatureFlags.list()).toEqual({})
		expect(window.localStorage['obojobo:flags']).toBeUndefined()

		window.JSON = originalJSON
	})

	test('When getting a feature flag fails all flags are deleted', () => {
		window.localStorage['obojobo:flags'] = '{This will cause a JSON.parse error!'

		FeatureFlags.constructor()

		expect(console.error).toHaveBeenCalledWith(
			'Unable to parse feature flags: SyntaxError: Unexpected token T in JSON at position 1'
		)
		expect(window.localStorage['obojobo:flags']).toBeUndefined()
	})
})
