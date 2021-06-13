import getDisplayFriendlyScore from './get-display-friendly-score'

const whitespaceRegex = /\s/g

const getModText = (attemptCondition, totalNumberOfAttemptsAllowed) => {
	attemptCondition = ('' + attemptCondition)
		.replace(whitespaceRegex, '')
		.replace('$last_attempt', '' + totalNumberOfAttemptsAllowed)

	const range = []
	if (attemptCondition.indexOf(',') === -1) {
		range.push(parseInt(attemptCondition, 10))
	} else {
		const tokens = attemptCondition.split(',')
		range.push(parseInt(tokens[0].substr(1), 10))
		range.push(parseInt(tokens[1].substr(0, tokens[1].length - 1), 10))

		if (tokens[0].charAt(0) === '(') range[0]++
		if (tokens[1].charAt(tokens[1].length - 1) === ')') range[1]--

		if (range[0] === range[1]) range.splice(1, 1)
	}

	if (range.length === 1) {
		if (range[0] === 1) return 'Passed on first attempt'
		if (range[0] === totalNumberOfAttemptsAllowed) return 'Passed on last attempt'
		return 'Passed on attempt\u00a0' + range[0]
	}

	return 'Passed on attempts ' + range[0] + ' to ' + range[1]
}

const getTextItemsForMods = (mods, totalNumberOfAttemptsAllowed) => {
	return mods.map(mod => {
		return {
			type: parseInt(mod.reward, 10) >= 0 ? 'extra-credit' : 'penalty',
			text: getModText(mod.attemptCondition, totalNumberOfAttemptsAllowed),
			value: getDisplayFriendlyScore(Math.abs(mod.reward))
		}
	})
}

export default getTextItemsForMods
