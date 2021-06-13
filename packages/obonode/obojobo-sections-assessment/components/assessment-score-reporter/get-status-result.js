const getStatusResult = (rubric, status) => {
	switch (status) {
		case 'passed':
			return typeof rubric.passedResult !== 'undefined' ? rubric.passedResult : 100
		case 'failed':
			return typeof rubric.failedResult !== 'undefined' ? rubric.failedResult : 0
		case 'unableToPass':
			return typeof rubric.unableToPassResult !== 'undefined' ? rubric.unableToPassResult : 0
	}

	throw new Error('Unknown status: ' + status)
}

export default getStatusResult
