import React from 'react'
import Common from 'Common'
import AssessmentScoreReportView from '../assessment-score-report-view'
const { Dialog } = Common.components.modal

const ResultsDialog = ({ label, attemptNumber, scoreReport, onShowClick }) => (
	<Dialog
		modalClassName="obojobo-draft--sections--assessment--results-modal"
		centered
		buttons={[
			{
				value: `Show ${label} Overview`,
				onClick: onShowClick,
				default: true
			}
		]}
		title={`Attempt ${attemptNumber} Results`}
		width="35rem"
	>
		<AssessmentScoreReportView report={scoreReport} />
	</Dialog>
)

export default ResultsDialog
