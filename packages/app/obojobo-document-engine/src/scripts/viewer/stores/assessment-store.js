import AssessmentAPI from '../util/assessment-api'
import AssessmentScoreReporter from '../assessment/assessment-score-reporter'
import AssessmentUtil from '../util/assessment-util'
import Common from 'Common'
import FocusUtil from '../util/focus-util'
import LTINetworkStates from './assessment-store/lti-network-states'
import LTIResyncStates from './assessment-store/lti-resync-states'
import NavStore from '../stores/nav-store'
import NavUtil from '../util/nav-util'
import QuestionStore from './question-store'
import QuestionUtil from '../util/question-util'
import React from 'react'
import findItemsWithMaxPropValue from '../../common/util/find-items-with-max-prop-value'
import UnfinishedAttemptDialog from 'obojobo-sections-assessment/components/dialogs/unfinished-attempt-dialog'
import ResultsDialog from 'obojobo-sections-assessment/components/dialogs/results-dialog'
import PreAttemptImportScoreDialog from 'obojobo-sections-assessment/components/dialogs/pre-attempt-import-score-dialog'
import UpdatedModuleDialog from 'obojobo-sections-assessment/components/dialogs/updated-module-dialog'
import injectKatexIfNeeded from 'obojobo-document-engine/src/scripts/common/util/inject-katex-if-needed'
import {
	ERROR_INVALID_ATTEMPT_END,
	ERROR_INVALID_ATTEMPT_RESUME
} from 'obojobo-sections-assessment/server/error-constants.js'

const QUESTION_NODE_TYPE = 'ObojoboDraft.Chunks.Question'
const ASSESSMENT_NODE_TYPE = 'ObojoboDraft.Sections.Assessment'
const { Dispatcher, Store } = Common.flux
const { OboModel } = Common.models
const { ErrorUtil, ModalUtil } = Common.util

class AssessmentStore extends Store {
	constructor() {
		super('assessmentstore')

		Dispatcher.on('assessment:startAttempt', payload => {
			this.startAttemptWithImportScoreOption(payload.value.id)
		})

		Dispatcher.on('assessment:endAttempt', payload => {
			this.endAttemptWithAPICall(payload.value.id, payload.value.context)
		})

		Dispatcher.on('assessment:resendLTIScore', payload => {
			this.tryResendLTIScore(payload.value.id)
		})

		Dispatcher.on('question:setResponse', payload => {
			this.trySetResponse(payload.value.id, payload.value.response, payload.value.targetId)
		})

		Dispatcher.on('window:closeAttempt', shouldPrompt => {
			if (AssessmentUtil.isInAssessment(this.state)) {
				shouldPrompt()
			}
		})

		Dispatcher.on('nav:afterNavChange', payload => {
			// when the first page is an assessment, this listener can be called before we're ready
			// load and cache assessmentIds after the page changes
			if (!this.assessmentIds) {
				this.assessmentIds = new Set()
				const assessmentModels = OboModel.getRoot().getDirectChildrenOfType(ASSESSMENT_NODE_TYPE)
				assessmentModels.forEach(m => this.assessmentIds.add(m.get('id')))
			}

			// if the target page is an assessment, get the attempt history
			if (this.assessmentIds.has(payload.value.to)) this.getAttemptHistory()
		})
	}

	findUnfinishedAttemptInAssessmentSummary(summaries) {
		return summaries.find(s => typeof s.unfinishedAttemptId === 'string')
	}

	init(extensions) {
		const ext = { assessmentSummary: [], importableScore: null }
		const filteredExtArrays = extensions
			? extensions.filter(val => val.name === ASSESSMENT_NODE_TYPE)
			: []
		Object.assign(ext, ...filteredExtArrays) // merge matching extensions

		const unfinishedAttempt = this.findUnfinishedAttemptInAssessmentSummary(ext.assessmentSummary)

		this.state = {
			assessments: {}, // assessments found in attempt history
			importHasBeenUsed: false, // @TODO: this will need to be updated to support multiple assessments
			importableScore: ext.importableScore,
			assessmentSummary: ext.assessmentSummary,
			attemptHistoryLoadState: 'none', // not loaded yet
			isResumingAttempt: unfinishedAttempt !== undefined //eslint-disable-line no-undefined
		}

		if (unfinishedAttempt) {
			this.displayUnfinishedAttemptNotice(unfinishedAttempt.unfinishedAttemptId)
		} else if (ext.importableScore && this.state.importHasBeenUsed !== true) {
			this.displayScoreImportNotice()
		}
	}

	// get an assessment summary from the state object
	getOrCreateAssessmentSummaryById(assessmentId) {
		// search for it in our summaries
		let summary = this.state.assessmentSummary.find(s => s.assessmentId === assessmentId)

		// none found, make one?
		if (!summary) {
			summary = {
				assessmentId: assessmentId,
				importUsed: false,
				scores: [],
				unfinishedAttemptId: null
			}

			// add to the state
			this.state.assessmentSummary.push(summary)
		}

		return summary
	}

	getOrCreateAssessmentById(assessmentId) {
		let assessment = this.state.assessments[assessmentId]

		if (!assessment) {
			assessment = {
				id: assessmentId,
				current: null,
				currentResponses: [],
				attempts: [],
				highestAssessmentScoreAttempts: [],
				highestAttemptScoreAttempts: [],
				lti: null,
				ltiNetworkState: LTINetworkStates.IDLE,
				ltiResyncState: LTIResyncStates.NO_RESYNC_ATTEMPTED,
				isShowingAttemptHistory: false
			}

			this.state.assessments[assessmentId] = assessment
		}

		return assessment
	}

	updateStateAfterAttemptHistory(attemptsByAssessment) {
		// copy data into our state
		attemptsByAssessment.forEach(assessmentItem => {
			const assessId = assessmentItem.assessmentId
			const attempts = assessmentItem.attempts
			const stateSummary = this.getOrCreateAssessmentSummaryById(assessId)
			const stateAssessment = this.getOrCreateAssessmentById(assessId)

			// copy attempts into state
			stateAssessment.attempts = attempts

			// copy ltiState into state
			stateAssessment.lti = assessmentItem.ltiState
			// find highest attemptScore
			stateAssessment.highestAttemptScoreAttempts = findItemsWithMaxPropValue(
				attempts,
				'result.attemptScore'
			)

			// find highest assessmentScore
			stateAssessment.highestAssessmentScoreAttempts = findItemsWithMaxPropValue(
				attempts,
				'assessmentScore'
			)

			// reset and fill below
			stateSummary.scores = []

			// rebuild stateSummary.scores
			// update importUsed
			// update unfinishedAttemptId
			attempts.forEach(attempt => {
				if (attempt.isImported) {
					this.state.importHasBeenUsed = true // @TODO: this will need to be updated to support multiple assessments
					stateSummary.importUsed = true
				}

				if (!attempt.isFinished) {
					stateSummary.unfinishedAttemptId = attempt.id
				} else {
					stateSummary.scores.push(attempt.assessmentScore)
				}
			})

			// can no longer import now that we have a score
			if (stateSummary.scores.length) this.state.importableScore = null
		})

		// UPDATE QUESTION STORE
		for (const assessment in this.state.assessments) {
			this.state.assessments[assessment].attempts.forEach(attempt => {
				const qState = {
					scores: {},
					responses: {}
				}

				attempt.result.questionScores.forEach(score => {
					qState.scores[score.id] = score
				})

				attempt.questionResponses.forEach(resp => {
					qState.responses[resp.questionId] = resp.response
				})

				QuestionStore.updateStateByContext(qState, `assessmentReview:${attempt.id}`)
			})
		}
	}

	resumeAttemptWithAPICall(unfinishedAttemptId) {
		ModalUtil.hide()
		const navState = NavStore.getState()
		return AssessmentAPI.resumeAttempt({
			draftId: navState.draftId,
			attemptId: unfinishedAttemptId,
			visitId: navState.visitId
		}).then(res => {
			// This error occurs when someone tries to resume an attempt
			// for an assessment that was updated. In this case, the attempt
			// was invalidated so we'll try to start a new attempt.
			if (res.status === 'error' && res.value.message === ERROR_INVALID_ATTEMPT_RESUME) {
				// IMPORTANT: This assumes that the id of the assessment
				// being resumed hasn't changed since the user started it.
				const summary = this.findUnfinishedAttemptInAssessmentSummary(this.state.assessmentSummary)
				this.startAttemptWithImportScoreOption(summary.assessmentId)
				return
			}

			this.updateStateAfterStartAttempt(res.value)
			this.triggerChange()
		})
	}

	getAttemptHistory() {
		if (this.state.attemptHistoryLoadState === 'none') {
			this.state.attemptHistoryLoadState = 'loading'
			const { draftId, visitId } = NavStore.getState()

			return AssessmentAPI.getAttemptHistory({ draftId, visitId }).then(res => {
				if (res.status === 'error') {
					return ErrorUtil.errorResponse(res)
				}

				this.updateStateAfterAttemptHistory(res.value)
				this.state.attemptHistoryLoadState = 'loaded'
				this.triggerChange()
			})
		}
	}

	startImportScoresWithAPICall(draftId, visitId, assessmentId) {
		return AssessmentAPI.importScore({
			visitId,
			draftId,
			assessmentId,
			importedAssessmentScoreId: this.state.importableScore.assessmentScoreId
		}).then(result => {
			if (result.status !== 'ok') {
				return ErrorUtil.errorResponse(result)
			}

			this.state.importHasBeenUsed = true
			// load new attempt history
			this.state.attemptHistoryLoadState = 'none'
			return this.getAttemptHistory()
		})
	}

	startAttemptWithAPICall(draftId, visitId, assessmentId) {
		return AssessmentAPI.startAttempt({
			draftId,
			assessmentId,
			visitId
		}).then(res => {
			if (res.status === 'error') {
				switch (res.value.message.toLowerCase()) {
					case 'attempt limit reached':
						ErrorUtil.show(
							'No attempts left',
							'You have attempted this assessment the maximum number of times available.'
						)
						break
					case 'id not found':
						ErrorUtil.show(
							'Assessment ID not found',
							`Couldn't find an assessment with ID "${assessmentId}".`
						)
						break
					default:
						ErrorUtil.errorResponse(res)
				}
			} else {
				this.updateStateAfterStartAttempt(res.value)
			}

			this.triggerChange()
		})
	}

	async startAttemptWithImportScoreOption(assessmentId) {
		// import has been used, do nothing
		if (this.state.importHasBeenUsed === true) {
			this.displayImportAlreadyUsed()
			return
		}

		let shouldImport = false

		if (this.state.importableScore && this.state.importableScore.assessmentId === assessmentId) {
			// import high score or start an attempt (true = import, false = new attempt)
			shouldImport = await this.displayPreAttemptImportScoreNotice(
				this.state.importableScore.highestScore
			)

			ModalUtil.hide()
		}

		const { draftId, visitId } = NavStore.getState()
		const apiCall = shouldImport ? this.startImportScoresWithAPICall : this.startAttemptWithAPICall

		return await apiCall.call(this, draftId, visitId, assessmentId)
	}

	async updateStateAfterStartAttempt(startAttemptResp) {
		// Need to make sure katex gets injected when the only
		// place latex is used is in the assessment, since it
		// won't be detected when first loading a module.
		await injectKatexIfNeeded({ value: startAttemptResp })

		const id = startAttemptResp.assessmentId
		const model = OboModel.models[id]

		model.children.at(1).children.reset()
		for (const child of Array.from(startAttemptResp.questions)) {
			const c = OboModel.create(child)
			model.children.at(1).children.add(c)
		}

		const stateAssessment = this.getOrCreateAssessmentById(id)
		stateAssessment.current = startAttemptResp

		NavUtil.setContext(`assessment:${startAttemptResp.assessmentId}:${startAttemptResp.attemptId}`)
		NavUtil.rebuildMenu(model.getRoot())
		NavUtil.goto(id)

		model.processTrigger('onStartAttempt')
		Dispatcher.trigger('assessment:attemptStarted', id)
	}

	endAttemptWithAPICall(assessmentId, context) {
		const assessment = this.state.assessments[assessmentId]
		const wasResumingAttempt = this.state.isResumingAttempt
		const { draftId, visitId } = NavStore.getState()
		return AssessmentAPI.endAttempt({
			attemptId: assessment.current.attemptId,
			draftId,
			visitId
		})
			.then(res => {
				if (res.status === 'error') {
					switch (res.value.message) {
						case ERROR_INVALID_ATTEMPT_END:
							// This error occurs when someone tries to submit an attempt
							// for an assessment that was updated. In this case, we need
							// to let the user write down their answers and restart
							// a new attempt
							return Promise.reject(new Error(res.value.message))
						default:
							return ErrorUtil.errorResponse(res)
					}
				}

				this.state.attemptHistoryLoadState = 'none'
				this.state.isResumingAttempt = false

				/* === BUILD SCORE REPORT DISPLAY == */

				// collect all the scoreDetails objects from each assessment
				const allScoreDetails = assessment.attempts.map(a => a.scoreDetails)
				if (wasResumingAttempt) {
					allScoreDetails.splice(-1, 1) // removes incomplete attempt
				}
				// append the results of endAttempt
				// it's essentially a scoreDetails object
				allScoreDetails.push(res.value)

				const model = OboModel.models[assessmentId]
				const reporter = new AssessmentScoreReporter({
					assessmentRubric: model.modelState.rubric.toObject(),
					totalNumberOfAttemptsAllowed: model.modelState.attempts,
					allScoreDetails
				})

				const assessmentLabel = NavUtil.getNavLabelForModel(NavStore.getState(), model)
				const scoreReport = reporter.getReportFor(res.value.attemptNumber)
				this.displayResultsModal(assessmentLabel, res.value.attemptNumber, scoreReport)

				return this.getAttemptHistory()
			})
			.then(() => {
				this.updateStateAfterEndAttempt(assessmentId, context)
				this.triggerChange()
			})
			.catch(e => {
				switch (e.message) {
					case ERROR_INVALID_ATTEMPT_END:
						// Manually trigger an attempt end so the assessment component
						// doesn't permanently disable its submit button
						Dispatcher.trigger('assessment:attemptEnded', assessmentId)
						ModalUtil.show(
							<UpdatedModuleDialog
								onConfirm={this.onCloseUpdatedModuleDialog.bind(this, assessmentId)}
							/>,
							false
						)
						break
					default:
						console.error(e) /* eslint-disable-line no-console */
				}
			})
	}

	onCloseUpdatedModuleDialog(assessmentId) {
		ModalUtil.hide()
		// IMPORTANT: This assumes that the id of the assessment
		// being resumed hasn't changed since the user started it.
		this.startAttemptWithImportScoreOption(assessmentId)
	}

	onCloseResultsDialog() {
		ModalUtil.hide()
		FocusUtil.focusOnNavTarget()
	}

	updateStateAfterEndAttempt(assessmentId, context) {
		const assessment = this.state.assessments[assessmentId]
		const model = OboModel.models[assessmentId]
		// flip all questions back over
		assessment.current.state.chosen.forEach(question => {
			if (question.type === QUESTION_NODE_TYPE) {
				QuestionUtil.hideQuestion(question.id, context)
			}
		})

		// clear responses for each question in this assessment
		assessment.currentResponses.forEach(questionId =>
			QuestionUtil.clearResponse(questionId, context)
		)

		assessment.current = null

		model.processTrigger('onEndAttempt')

		Dispatcher.trigger('assessment:attemptEnded', assessmentId)
	}

	tryResendLTIScore(assessmentId) {
		const assessmentModel = OboModel.models[assessmentId]
		const assessment = AssessmentUtil.getAssessmentForModel(this.state, assessmentModel)

		assessment.ltiNetworkState = LTINetworkStates.AWAITING_SEND_ASSESSMENT_SCORE_RESPONSE
		this.triggerChange()

		return AssessmentAPI.resendLTIAssessmentScore({
			draftId: assessmentModel.getRoot().get('draftId'),
			assessmentId: assessmentModel.get('id'),
			visitId: NavStore.getState().visitId
		})
			.then(res => {
				assessment.ltiNetworkState = LTINetworkStates.IDLE

				if (res.status === 'error') {
					return ErrorUtil.errorResponse(res)
				}

				this.updateLTIScore(
					AssessmentUtil.getAssessmentForModel(this.state, assessmentModel),
					res.value
				)
				this.triggerChange()
			})
			.catch(e => {
				console.error(e) /* eslint-disable-line no-console */
			})
	}

	updateLTIScore(assessment, updateLTIScoreResp) {
		assessment.lti = updateLTIScoreResp

		const assessmentModel = OboModel.models[assessment.id]
		if (AssessmentUtil.isLTIScoreNeedingToBeResynced(this.state, assessmentModel)) {
			assessment.ltiResyncState = LTIResyncStates.RESYNC_FAILED
		} else {
			assessment.ltiResyncState = LTIResyncStates.RESYNC_SUCCEEDED
		}

		this.triggerChange()
	}

	trySetResponse(questionId) {
		const model = OboModel.models[questionId]
		const assessment = AssessmentUtil.getAssessmentForModel(this.state, model)

		if (!assessment || !assessment.currentResponses) {
			// Resolve false if not an error but couldn't do anything because not in an attempt
			return Promise.resolve(false)
		}

		assessment.currentResponses.push(questionId)
		this.triggerChange()
	}

	getState() {
		return this.state
	}

	setState(newState) {
		return (this.state = newState)
	}

	displayPreAttemptImportScoreNotice(highestScore) {
		return new Promise(resolve => {
			const shouldImport = choice => resolve(choice)

			ModalUtil.show(
				<PreAttemptImportScoreDialog highestScore={highestScore} onChoice={shouldImport} />
			)
		})
	}

	displayResultsModal(label, attemptNumber, scoreReport) {
		ModalUtil.show(
			<ResultsDialog
				label={label}
				attemptNumber={attemptNumber}
				scoreReport={scoreReport}
				onShowClick={this.onCloseResultsDialog.bind(this)}
			/>
		)
	}

	displayUnfinishedAttemptNotice(attemptId) {
		const onConfirm = this.resumeAttemptWithAPICall.bind(this, attemptId)
		ModalUtil.show(<UnfinishedAttemptDialog onConfirm={onConfirm} />, true)
	}

	displayScoreImportNotice() {
		Dispatcher.trigger('viewer:alert', {
			value: {
				title: 'Score Import Available',
				message: `You previously completed this module in another course or assignment. The option to import your highest score will be shown when you start the assessment.`
			}
		})
	}

	displayImportAlreadyUsed() {
		Dispatcher.trigger('viewer:alert', {
			value: {
				title: 'Score Already Imported',
				message:
					'You have already imported a score for this module in this course, no attempts remain.'
			}
		})
	}
}

const assessmentStore = new AssessmentStore()
export default assessmentStore
