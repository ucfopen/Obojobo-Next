/*
Defines an API for users and the codebase to get, set and clear feature flags.
It is intentionally kept very basic - Flags are key value pairs where both key and value are strings
only.
Feature flags are kept in localStorage as encoded JSON. If at any time the JSON can't be parsed and
there's an error then all set flags are deleted to return to a clean slate, so that there are no
issues with bad feature flag settings stopping Obojobo from running.
It is expected that this API will be exposed to the user via window.

Usage examples:

Expose this singleton to the user:
	window.obojobo.flags = FeatureFlags

How a user would interact with this in a javascript console (examples):
	obojobo.flags.set('experimental.darkMode', obojobo.flags.ENABLED)
	> true

	obojobo.flags.list()
	> { "experimental.darkMode": "enabled" }

	obojobo.flags.clear('experimental.darkMode')
	> true

	obojobo.flags.list()
	> {}

How to incorporate into your code:
	const FEATURE_FLAG_DARK_MODE = 'experimental.darkMode'
	// ...
	if(FeatureFlags.is(FEATURE_FLAG_DARK_MODE, FeatureFlags.ENABLED)) { ... }
*/

const LOCAL_STORAGE_FLAGS_KEY = 'obojobo:flags'

const writeFlagsToLocalStorage = flags => {
	try {
		const string = JSON.stringify(flags)
		window.localStorage[LOCAL_STORAGE_FLAGS_KEY] = string

		return true
	} catch (e) {
		//eslint-disable-next-line no-console
		console.error('Unable to save feature flags: ' + e)
		delete window.localStorage[LOCAL_STORAGE_FLAGS_KEY]

		return false
	}
}

const getFlagsFromLocalStorage = () => {
	try {
		const localStorageFlags = window.localStorage[LOCAL_STORAGE_FLAGS_KEY]

		if (typeof localStorageFlags !== 'undefined') {
			return JSON.parse(localStorageFlags)
		}
	} catch (e) {
		//eslint-disable-next-line no-console
		console.error('Unable to parse feature flags: ' + e)
		delete window.localStorage[LOCAL_STORAGE_FLAGS_KEY]
	}

	return {}
}

let flags = {}

class FeatureFlags {
	constructor() {
		flags = getFlagsFromLocalStorage()
	}

	// Sets the flag flagName to the value flagValue.
	// flagValue must be a string, if not it will be converted to a string
	// Returns true if the value was written, false otherwise
	set(flagName, flagValue) {
		const newFlags = { ...flags, [flagName]: '' + flagValue }

		if (writeFlagsToLocalStorage(newFlags)) {
			flags = newFlags
			return true
		}

		flags = {}
		return false
	}

	// Returns the value of flagName, or null if it doesn't exist
	get(flagName) {
		const value = flags[flagName]

		if (typeof value === 'undefined') {
			return null
		}

		return value
	}

	// Returns true if the value of flagName is value
	is(flagName, value) {
		return this.get(flagName) === '' + value
	}

	// Returns a copy of the value of all flags in memory
	list() {
		return { ...flags }
	}

	// Clears the value of flagName, returning true if successful
	clear(flagName) {
		const newFlags = { ...flags }
		delete newFlags[flagName]

		if (writeFlagsToLocalStorage(newFlags)) {
			flags = newFlags
			return true
		}

		flags = {}
		return false
	}

	// Clears all flags, returning true if successful
	clearAll() {
		flags = {}
		delete window.localStorage[LOCAL_STORAGE_FLAGS_KEY]

		return true
	}
}

const featureFlags = new FeatureFlags()

featureFlags.ENABLED = 'enabled'

export default featureFlags
