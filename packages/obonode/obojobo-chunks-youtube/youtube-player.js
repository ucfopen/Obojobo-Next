import React from 'react'
import Common from 'Common'
import insertDomTag from 'obojobo-document-engine/src/scripts/common/util/insert-dom-tag'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'
import { getStandardizedURLFromVideoId } from './parse-youtube-url'

const { uuid } = Common.util
const MediaUtil = Viewer.util.MediaUtil
// while youtube iframe api script is loading
// this will be filled with loadVideo() callbacks
// from YouTubePlayer components waiting for it to load
// They'll all get called once it loads
const instanceCallbacksForYouTubeReady = []

// single global handler that notifies all registered YouTubePlayer Components
const onYouTubeIframeAPIReadyHandler = () => {
	// call every registered callback when ready
	instanceCallbacksForYouTubeReady.forEach(cb => cb())
}

class YouTubePlayer extends React.Component {
	constructor(props) {
		super(props)
		this.playerId = `obojobo-draft--chunks-you-tube-player-${uuid()}`
		this.player = null
		this.url = null
		this.loadVideo = this.loadVideo.bind(this)
		this.onStateChange = this.onStateChange.bind(this)
		this.currentTime = null
		this.previousTime = null
		this.currentState = {
			actor: 'youtube',
			action: 'unstarted',
			playheadPosition: 0,
			isPossibleSeekTo: false,
			playheadPositionBeforeSeekTo: 0
		}
	}

	componentDidMount() {
		// load YouTube Iframe API if it's not here yet
		if (!window.YT) {
			this.loadYouTubeAPIWithCallback(this.loadVideo)
		} else {
			this.loadVideo()
		}
	}

	componentDidUpdate(prevProps) {
		// Don't update this component if the video properties haven't changed
		if (!this.shouldVideoUpdate(prevProps)) {
			return
		}

		this.loadVideo()
	}

	componentWillUnmount() {
		if (this.currentState.action !== 'ended') {
			const currentPlayheadPosition = Math.floor(this.player.getCurrentTime())

			MediaUtil.mediaUnloaded('user', currentPlayheadPosition, this.url, this.nodeId)
		}
	}

	loadYouTubeAPIWithCallback(onReadyCallBack) {
		// register a callback for this component
		instanceCallbacksForYouTubeReady.push(onReadyCallBack)

		// no event handler registered yet?
		if (!window.onYouTubeIframeAPIReady) {
			// register a single global handler
			window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReadyHandler

			// add the script tag that loads the youtube iframe api
			insertDomTag({ src: '//www.youtube.com/iframe_api' }, 'script')
		}
	}

	loadVideo() {
		if (!this.props.content || !window.YT || !window.YT.Player) {
			return
		}

		const { videoId, startTime, endTime } = this.props.content
		this.url = getStandardizedURLFromVideoId(videoId)

		if (this.player) {
			this.player.cueVideoById({
				videoId,
				startSeconds: startTime,
				endSeconds: endTime
			})
			return
		}

		this.player = new window.YT.Player(this.playerId, {
			videoId,
			// use youtube enhanced privacy mode
			host: 'https://www.youtube-nocookie.com',
			playerVars: {
				start: startTime,
				end: endTime
			},
			events: {
				onStateChange: this.onStateChange
			}
		})
	}

	shouldVideoUpdate(prevProps) {
		const prevContent = prevProps.content
		const { startTime, endTime, videoId } = this.props.content

		return (
			prevContent.startTime !== startTime ||
			prevContent.endTime !== endTime ||
			prevContent.videoId !== videoId
		)
	}

	onStateChange(playerState) {
		const currentPlayheadPosition = Math.floor(this.player.getCurrentTime())

		switch (playerState.data) {
			case -1: // video unstarted
				this.currentState = {
					actor: 'youtube',
					action: 'unstarted',
					playheadPosition: currentPlayheadPosition,
					isPossibleSeekTo: false,
					playheadPositionBeforeSeekTo: 0
				}
				break
			case 0: // video ended
				this.currentState = {
					actor: 'youtube',
					action: 'ended',
					playheadPosition: currentPlayheadPosition,
					isPossibleSeekTo: false,
					playheadPositionBeforeSeekTo: 0
				}
				MediaUtil.mediaEnded(
					this.currentState.actor,
					this.currentState.playheadPosition,
					this.url,
					this.props.nodeId
				)
				break
			case 1: // video playing
				this.currentState = this.playOrSeekToEvent(this.currentState, currentPlayheadPosition)

				if (this.currentState.isPossibleSeekTo) {
					this.currentState.isPossibleSeekTo = false
					MediaUtil.mediaSeekTo(
						this.currentState.actor,
						this.currentState.playheadPosition,
						this.currentState.playheadPositionBeforeSeekTo,
						this.url,
						this.props.nodeId
					)
				} else {
					MediaUtil.mediaPlayed(
						this.currentState.actor,
						this.currentState.playheadPosition,
						this.url,
						this.props.nodeId
					)
				}
				break
			case 2: // video paused
				this.currentState = {
					actor: 'user',
					action: 'paused',
					playheadPosition: currentPlayheadPosition,
					isPossibleSeekTo: this.currentState.playheadPosition !== currentPlayheadPosition,
					playheadPositionBeforeSeekTo: this.currentState.playheadPosition
				}

				MediaUtil.mediaPaused(
					this.currentState.actor,
					this.currentState.playheadPosition,
					this.url,
					this.props.nodeId
				)
				break
			case 3: // video buffering
				if (this.currentState.action === 'unstarted') {
					this.currentState.actor = 'user'
				} else if (this.currentState.action === 'paused' && this.currentState.actor === 'user') {
					this.currentState.actor = 'user'
				} else {
					this.currentState.actor = 'youtube'
				}

				this.currentState.action = 'buffering'
				this.currentState.playheadPosition = currentPlayheadPosition

				MediaUtil.mediaBuffering(
					this.currentState.actor,
					this.currentState.playheadPosition,
					this.url,
					this.props.nodeId
				)
				break
			case 5: // video cued
				this.currentState = {
					actor: 'youtube',
					action: 'cued',
					playheadPosition: currentPlayheadPosition,
					isPossibleSeekTo: false,
					playheadPositionBeforeSeekTo: 0
				}
				break
		}
	}

	playOrSeekToEvent(currentState, currentPlayheadPosition) {
		switch (currentState.action) {
			case 'buffering':
				if (
					currentState.playheadPosition === currentPlayheadPosition &&
					currentState.actor === 'user'
				) {
					currentState.actor = 'user'
				}
				if (currentState.playheadPosition !== currentPlayheadPosition) {
					currentState.isPossibleSeekTo = true
				}
				break
			case 'unstarted':
				currentState.actor = 'user'
				break
			case 'paused':
				currentState.actor = 'user'
				currentState.isPossibleSeekTo = !(currentState.playheadPosition === currentPlayheadPosition)
				break
			default:
				currentState.actor = 'youtube'
		}
		currentState.action = 'playing'
		currentState.playheadPosition = currentPlayheadPosition

		return currentState
	}

	render() {
		return <div id={this.playerId} className="obojobo-draft--chunks-you-tube-player" />
	}
}

export default YouTubePlayer
