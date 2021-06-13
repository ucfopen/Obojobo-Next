// import Common from 'Common'
// const { findItemsWithMaxPropValue } = Common.findItemsWithMaxPropValue
import findItemsWithMaxPropValue from 'obojobo-document-engine/src/scripts/common/util/find-items-with-max-prop-value'
// import findItemsWithMaxPropValue from '../../../../app/obojobo-document-engine/src/scripts/common/util/find-items-with-max-prop-value'
// import findItemsWithMaxPropValue from '../../../common/util/find-items-with-max-prop-value'

// app/doc-engine/src/scripts/common/util/find-gblkasd

const getScoreComparisonData = (allScoreDetails, attemptNumberToGenerateReportFor) => {
	if (allScoreDetails.length === 0) {
		return {
			prevHighestInfo: null,
			newInfo: null
		}
	}

	const prevDetails = allScoreDetails.slice(0, attemptNumberToGenerateReportFor - 1)
	const highestDetails = findItemsWithMaxPropValue(prevDetails, 'assessmentScore')

	return {
		prevHighestInfo: highestDetails.length === 0 ? null : highestDetails[highestDetails.length - 1],
		newInfo: allScoreDetails[attemptNumberToGenerateReportFor - 1]
	}
}

export default getScoreComparisonData
