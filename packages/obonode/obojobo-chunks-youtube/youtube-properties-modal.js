import './youtube-properties-modal.scss'

import React from 'react'
import Common from 'obojobo-document-engine/src/scripts/common'
import {
	parseURLOrEmbedCode,
	getStandardizedURLFromVideoId
} from 'obojobo-document-engine/src/scripts/oboeditor/util/url-embed-code-check'
import Button from 'obojobo-document-engine/src/scripts/common/components/button'

const { SimpleDialog } = Common.components.modal
const YOUTUBE_NODE = 'ObojoboDraft.Chunks.YouTube'

class YouTubeProperties extends React.Component {
	constructor(props) {
		super(props)

		this.formRef = React.createRef()
		this.endRef = React.createRef()
		this.urlRef = React.createRef()

		this.focusOnFirstElement = this.focusOnFirstElement.bind(this)
		this.onConfirm = this.onConfirm.bind(this)
		this.onStartTimeChange = this.onStartTimeChange.bind(this)
		this.onEndTimeChange = this.onEndTimeChange.bind(this)
		this.onUrlChange = this.onUrlChange.bind(this)
		this.onUrlPaste = this.onUrlPaste.bind(this)
		this.onUrlBlur = this.onUrlBlur.bind(this)
		this.onClickEditTimesButton = this.onClickEditTimesButton.bind(this)
		this.onClickClearTimesButton = this.onClickClearTimesButton.bind(this)

		this.state = {
			isEditingTime: !!this.props.content.startTime || !!this.props.content.endTime,
			url: getStandardizedURLFromVideoId(this.props.content.videoId),
			startTime: this.secondsToTimeDisplay(this.props.content.startTime),
			endTime: this.secondsToTimeDisplay(this.props.content.endTime),
			startTimeSeconds: this.props.content.startTime || null,
			endTimeSeconds: this.props.content.endTime || null
		}
	}

	secondsToTimeDisplay(seconds) {
		if (!seconds) {
			return ''
		}

		const mins = Math.floor(seconds / 60)
		const remainingSeconds = seconds - mins * 60

		return `${mins}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	getSecondsFromTimeDisplay(timeString) {
		if (!timeString) {
			return null
		}

		if (timeString.indexOf(':') === -1) {
			return parseInt(timeString, 10) || null
		}

		const [mins, secs] = timeString.split(':')
		return parseInt(mins, 10) * 60 + parseInt(secs, 10)
	}

	focusOnFirstElement() {
		return this.urlRef.current.focus()
	}

	onUrlChange(event) {
		this.setState({
			url: event.target.value
		})
	}

	onUrlPaste(event) {
		const pastedText = event.clipboardData.getData('text')

		// Timeout necessary to allow the paste operation to complete
		setTimeout(() => {
			this.updateStateFromUserInput(pastedText)
		})
	}

	onUrlBlur() {
		this.updateStateFromUserInput(this.state.url)
	}

	updateStateFromUserInput(userURL) {
		const videoInfo = parseURLOrEmbedCode(userURL, YOUTUBE_NODE)
		const url = videoInfo.standardizedVideoUrl

		// If the URL includes time information then we replace the existing start and end times
		// with the new values. Otherwise, we leave them alone (in case the user has corrected
		// a typo in the ID but doesn't want to lose their already-input time values)
		if (videoInfo.startSeconds !== null || videoInfo.endSeconds !== null) {
			const startTime = this.secondsToTimeDisplay(videoInfo.startSeconds)
			const endTime = this.secondsToTimeDisplay(videoInfo.endSeconds)

			this.setState({
				url,
				startTime,
				endTime,
				isEditingTime: true
			})
		} else {
			this.setState({
				url
			})
		}
	}

	onClickEditTimesButton() {
		this.setState({
			isEditingTime: true
		})
	}

	onClickClearTimesButton() {
		this.setState({
			isEditingTime: false,
			startTime: null,
			endTime: null,
			startTimeSeconds: null,
			endTimeSeconds: null
		})
	}

	onStartTimeChange(event) {
		this.setState(
			{
				startTime: event.target.value,
				startTimeSeconds: this.getSecondsFromTimeDisplay(event.target.value)
			},
			this.updateValidation.bind(this)
		)
	}

	onEndTimeChange(event) {
		this.setState(
			{
				endTime: event.target.value,
				endTimeSeconds: this.getSecondsFromTimeDisplay(event.target.value)
			},
			this.updateValidation.bind(this)
		)
	}

	updateValidation() {
		if (
			this.state.startTimeSeconds !== null &&
			this.state.endTimeSeconds !== null &&
			this.state.startTimeSeconds >= this.state.endTimeSeconds
		) {
			this.endRef.current.setCustomValidity('The video end time must come after the start time')
		} else {
			this.endRef.current.setCustomValidity('')
		}
	}

	getContentFromState() {
		return {
			videoId: parseURLOrEmbedCode(this.state.url, YOUTUBE_NODE).videoId,
			startTime: this.getSecondsFromTimeDisplay(this.state.startTime),
			endTime: this.getSecondsFromTimeDisplay(this.state.endTime)
		}
	}

	onConfirm() {
		const formIsValid = this.formRef.current.reportValidity()

		if (formIsValid) {
			this.props.onConfirm(this.getContentFromState())
		}
	}

	render() {
		return (
			<SimpleDialog
				cancelOk
				title="YouTube Video"
				focusOnFirstElement={this.focusOnFirstElement}
				onConfirm={this.onConfirm}
				width={'30rem'}
			>
				<form
					ref={this.formRef}
					className="youtube-video-properties"
					onSubmit={event => event.preventDefault()}
				>
					<div className="youtube-video-properties-input-wrapper">
						<label>YouTube video url or embed code:</label>
					</div>
					<input
						id="obojobo-draft--chunks--youtube--video-url"
						type="text"
						required
						ref={this.urlRef}
						value={this.state.url}
						onChange={this.onUrlChange}
						onBlur={this.onUrlBlur}
						onPaste={this.onUrlPaste}
					/>
					{this.state.isEditingTime ? (
						<div className="edit-times">
							<h2>Start &amp; End Times</h2>

							<label>Start video at time (optional):</label>
							<small>Seconds or MM:SS format (e.g. 135 or 2:15)</small>
							<input
								id="obojobo-draft--chunks--youtube--start-time"
								className="time-input"
								type="text"
								value={this.state.startTime}
								onChange={this.onStartTimeChange}
								pattern={'([0-9]+:[0-9]+)|([0-9]+)'}
							/>
							<label>End video at time (optional):</label>
							<small>Seconds or MM:SS format (e.g. 135 or 2:15)</small>
							<input
								id="obojobo-draft--chunks--youtube--end-time"
								className="time-input"
								ref={this.endRef}
								type="text"
								value={this.state.endTime}
								onChange={this.onEndTimeChange}
								pattern={'([0-9]+:[0-9]+)|([0-9]+)'}
							/>
							<Button onClick={this.onClickClearTimesButton} className="edit-times-button hide">
								Clear Start &amp; End Times
							</Button>
						</div>
					) : (
						<Button onClick={this.onClickEditTimesButton} className="edit-times-button show">
							Set Start &amp; End Time...
						</Button>
					)}
				</form>
			</SimpleDialog>
		)
	}
}

export default YouTubeProperties
