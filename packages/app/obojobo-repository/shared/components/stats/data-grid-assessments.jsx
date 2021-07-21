const React = require('react')
const DataGridScores = require('./data-grid-scores')
const getAssessmentStatsFromAttemptStats = require('../../util/get-assessment-stats-from-attempt-stats')

const cellURL = row => (
	<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
		<a target="_blank" rel="noreferrer" href={row.launchPresentationReturnUrl}>
			{row.launchPresentationReturnUrl}
		</a>
	</div>
)

const cellString = selector => {
	const fn = row => <div>{String(row[selector])}</div>
	return fn
}

const columns = [
	{
		name: 'First Name',
		selector: 'userFirstName',
		sortable: true,
		advanced: false
	},
	{
		name: 'Last Name',
		selector: 'userLastName',
		sortable: true,
		advanced: false
	},
	{
		name: 'User Roles',
		selector: 'userRoles',
		sortable: true,
		advanced: true
	},
	{
		name: 'Course ID',
		selector: 'contextId',
		sortable: true,
		advanced: true
	},
	{
		name: 'Course Title',
		selector: 'courseTitle',
		sortable: true,
		advanced: false
	},
	{
		name: 'Resource Link ID',
		selector: 'resourceLinkId',
		sortable: true,
		advanced: true
	},
	{
		name: 'Resource Link Title',
		selector: 'resourceLinkTitle',
		sortable: true,
		advanced: false
	},
	{
		name: 'URL',
		selector: 'launchPresentationReturnUrl',
		cell: cellURL,
		sortable: true,
		advanced: false
	},
	{
		name: 'Draft ID',
		selector: 'draftId',
		sortable: true,
		advanced: true
	},
	{
		name: 'Draft Content ID',
		selector: 'draftContentId',
		sortable: true,
		advanced: true
	},
	{
		name: 'Module Title',
		selector: 'moduleTitle',
		sortable: true,
		advanced: true
	},
	{
		name: 'Assessment ID',
		selector: 'assessmentId',
		sortable: true,
		advanced: true
	},
	{
		name: 'Username',
		selector: 'username',
		sortable: true,
		advanced: true
	},
	{
		name: 'Final Assessment Score',
		sortable: true,
		advanced: false,
		selector: 'highestAssessmentScore',
		cell: cellString('highestAssessmentScore')
	},
	{
		name: 'Preview Mode',
		sortable: true,
		advanced: false,
		selector: 'isPreview',
		cell: cellString('isPreview')
	}
]

function DataGridAssessments({ attempts = [], filterSettings, searchSettings, searchContent }) {
	const assessmentScores = getAssessmentStatsFromAttemptStats(attempts)

	return (
		<div className="repository--data-grid-assessments">
			<DataGridScores
				tableName="Final Assessment Scores"
				csvFileName="final-assessment-scores"
				columns={columns}
				rows={assessmentScores}
				filterSettings={filterSettings}
				searchSettings={searchSettings}
				searchContent={searchContent}
			/>
		</div>
	)
}

module.exports = DataGridAssessments
