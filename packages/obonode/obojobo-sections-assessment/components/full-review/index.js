import Common from 'obojobo-document-engine/src/scripts/common'
import React from 'react'
import ReviewIcon from '../review-icon'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'
import basicReview from './basic-review'
import formatDate from 'date-fns/format'
import AssessmentScoreReporter from '../assessment-score-reporter'
import AssessmentScoreReportView from '../assessment-score-report-view'

const { AssessmentUtil } = Viewer.util
const { NavUtil } = Viewer.util
const { OboModel } = Common.models
const { Button, ButtonBar, MoreInfoButton } = Common.components

class AssessmentReviewView extends React.Component {
	componentDidMount() {
		const lastAttempt = AssessmentUtil.getLastAttemptForModel(
			this.props.moduleData.assessmentState,
			this.props.model
		)

		NavUtil.setContext(`assessmentReview:${lastAttempt.id}`)
	}

	render() {
		const attemptReviewComponents = {}

		const attempts = this.props.attempts

		const highestAttempts = AssessmentUtil.getHighestAttemptsForModelByAssessmentScore(
			this.props.moduleData.assessmentState,
			this.props.model
		)

		const scoreReporter = new AssessmentScoreReporter({
			assessmentRubric: this.props.model.modelState.rubric.toObject(),
			totalNumberOfAttemptsAllowed: this.props.model.modelState.attempts,
			allScoreDetails: attempts.map(a => a.scoreDetails)
		})

		const attemptReviewComponent = (attempt, isAHighestScoringNonNullAttempt) => {
			const date = new Date(attempt.completedAt)
			const dateString = formatDate(date, "M/dd/yy 'at' h:mmaaaa")
			const machineDateString = formatDate(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
			const ariaDateString = formatDate(date, "MMMM do yyyy 'at' h:mmaaaa")
			const numCorrect = AssessmentUtil.getNumCorrect(attempt.result.questionScores)
			const numPossibleCorrect = AssessmentUtil.getNumPossibleCorrect(attempt.result.questionScores)
			const report = scoreReporter.getReportFor(attempt.attemptNumber)

			let attemptScoreSummary = Math.round(attempt.result.attemptScore) + '%'
			if (attempt.result.attemptScore !== attempt.assessmentScore) {
				attemptScoreSummary +=
					' → ' +
					(attempt.assessmentScore === null
						? 'Did Not Pass'
						: Math.round(attempt.assessmentScore) + '%')
			}

			return (
				<div className="attempt-results">
					<div className="attempt-header">
						<div className="attempt-info-container">
							<ReviewIcon />
							<div className="attempt-info-content-container">
								<h4>
									<strong>{`Attempt ${attempt.attemptNumber}`}</strong>
									{isAHighestScoringNonNullAttempt ? (
										<span className="highest-attempt">
											<span aria-hidden>★</span> Highest Attempt
										</span>
									) : null}
								</h4>
								<div className="attempt-info-content">
									<div>
										{attempt.isImported ? 'Imported ' : 'Submitted '}
										<time dateTime={machineDateString} aria-hidden="true">
											{dateString}
										</time>
										<span className="for-screen-reader-only">{ariaDateString}</span>
									</div>
									<div>
										{numCorrect} out of {numPossibleCorrect} question
										{numPossibleCorrect === 1 ? '' : 's'} correct
									</div>
									<div>
										Attempt Score: <strong>{attemptScoreSummary}</strong>
										<MoreInfoButton ariaLabel="Click to explain attempt score in detail">
											<AssessmentScoreReportView report={report} />
										</MoreInfoButton>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div
						className={`review ${this.props.showFullReview ? 'is-full-review' : 'is-basic-review'}`}
					>
						{attempt.result.questionScores.map((scoreObj, index) => {
							const questionModel = OboModel.create(attempt.state.questionModels[scoreObj.id])
							const QuestionComponent = questionModel.getComponentClass()
							return this.props.showFullReview ? (
								<QuestionComponent
									model={questionModel}
									moduleData={this.props.moduleData}
									key={scoreObj.id}
								/>
							) : (
								basicReview(questionModel, this.props.moduleData, scoreObj, index)
							)
						})}
					</div>
				</div>
			)
		}

		const getSelectedIndex = () => {
			const context = this.props.moduleData.navState.context

			for (const i in attempts) {
				const attempt = attempts[i]

				if (context === `assessmentReview:${attempt.id}`) {
					return parseInt(i, 10)
				}
			}

			return attempts.length - 1
		}

		const attemptButtons = attempts.map((attempt, index) => {
			return (
				<Button
					onClick={() => NavUtil.setContext(`assessmentReview:${attempt.id}`)}
					key={index}
					ariaLabel={'Attempt ' + attempt.attemptNumber}
				>
					{attempt.attemptNumber}
				</Button>
			)
		})

		attempts.forEach(attempt => {
			attemptReviewComponents[`assessmentReview:${attempt.id}`] = attemptReviewComponent(
				attempt,
				highestAttempts.indexOf(attempt) > -1 && attempt.assessmentScore !== null
			)
		})

		return (
			<div className="attempt-review-container">
				<div
					className={`attempt-button-container ${
						attemptButtons.length <= 1 ? 'is-showing-one-item' : null
					}`}
				>
					<ButtonBar altAction selectedIndex={getSelectedIndex()}>
						{attemptButtons}
					</ButtonBar>
				</div>
				{attemptReviewComponents[this.props.moduleData.navState.context]}
			</div>
		)
	}
}

export default AssessmentReviewView
