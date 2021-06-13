const getScoreChangeDescription = ({ prevHighestInfo, newInfo }) => {
	if (prevHighestInfo === null || newInfo === null) return null

	const prevHighestScore = prevHighestInfo.assessmentModdedScore
	const newScore = newInfo.assessmentModdedScore

	if (newScore === null && prevHighestScore === null) {
		return 'This did not change your recorded score'
	}

	if (prevHighestScore === null) {
		return `✔ Your recorded score was updated to ${Math.round(newScore)}%`
	}

	if (newScore > prevHighestScore) {
		return `✔ Your recorded score was updated from ${Math.round(prevHighestScore)}% to ${Math.round(
			newScore
		)}%`
	}

	if (newScore === prevHighestScore) {
		return `This maintains your recorded score of ${Math.round(prevHighestScore)}%`
	}

	// Else newScore === null && prevHighestScore !== null
	return `This did not change your recorded score of ${Math.round(prevHighestScore)}%`
}

export default getScoreChangeDescription
