import React from 'react'
import YouTubePlayer from './youtube-player'
import Viewer from 'obojobo-document-engine/src/scripts/viewer'

const MediaUtil = Viewer.util.MediaUtil

import { mount } from 'enzyme'

jest.mock('obojobo-document-engine/src/scripts/common/util/insert-dom-tag', () => () => {
	// simulate loading the youtube iframe api
	global.window.onYouTubeIframeAPIReady()
})
jest.mock('obojobo-document-engine/src/scripts/common/util/uuid', () => {
	return () => 'mockId'
})

describe('YouTubePlayer', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('YouTubePlayer renders correctly', () => {
		const component = mount(<YouTubePlayer />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('YouTubePlayer updates video on content change', () => {
		// Mock YouTube's Iframe Player object
		window.YT = {
			Player: jest.fn(() => ({
				cueVideoById: jest.fn()
			}))
		}

		const mockContent = {
			videoId: 'mockId',
			startTime: 1,
			endTime: 2
		}
		const spy = jest.spyOn(YouTubePlayer.prototype, 'loadVideo')
		const component = mount(<YouTubePlayer content={mockContent} />)

		component.setProps({
			content: {
				...mockContent,
				videoId: 'foo'
			}
		})

		component.setProps({
			content: {
				...mockContent,
				startTime: 4
			}
		})

		component.setProps({
			content: {
				...mockContent,
				endTime: 14
			}
		})

		expect(spy).toHaveBeenCalledTimes(4)
	})

	test("YouTubePlayer doesn't update if content hasn't changed", () => {
		window.YT = {
			Player: jest.fn(() => ({
				destroy: jest.fn(),
				cueVideoById: jest.fn()
			}))
		}

		const mockContent = {
			videoId: 'mockId',
			startTime: 1,
			endTime: 2
		}
		const spy = jest.spyOn(YouTubePlayer.prototype, 'loadVideo')
		const component = mount(<YouTubePlayer content={mockContent} />)

		component.setProps({
			content: {
				...mockContent
			}
		})

		expect(spy).toHaveBeenCalledTimes(1)
		expect(component.instance().player.destroy).not.toHaveBeenCalled()
	})
})

describe('YouTubePlayer events', () => {
	let getCurrentTime
	let player

	beforeEach(() => {
		jest.clearAllMocks()
		jest.mock('obojobo-document-engine/src/scripts/viewer')
		jest.mock('./youtube-player')

		getCurrentTime = jest.fn()
		getCurrentTime.mockReturnValue(2) // simulates a currentPlayheadPosition to compared with the currentState.playheadPosition

		player = {
			getCurrentTime: getCurrentTime
		}
	})

	test('Unstarted event is received', () => {
		const component = mount(<YouTubePlayer />)
		component.instance().player = player
		component.instance().currentState = {
			actor: 'user',
			action: 'paused',
			...component.instance().currentState
		}

		component.instance().onStateChange({ data: -1 })

		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'youtube',
				action: 'unstarted'
			})
		)
	})

	test('Cued event is received', () => {
		const component = mount(<YouTubePlayer />)
		component.instance().player = player
		component.instance().currentState = {
			actor: 'user',
			action: 'paused',
			...component.instance().currentState
		}

		component.instance().onStateChange({ data: 5 })

		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'youtube',
				action: 'cued'
			})
		)
	})

	test('Ended event is received', () => {
		MediaUtil.mediaEnded = jest.fn()

		const component = mount(<YouTubePlayer />)
		component.instance().player = player
		component.instance().currentState = {
			...component.instance().currentState
		}

		component.instance().onStateChange({ data: 0 })

		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'youtube',
				action: 'ended'
			})
		)
		expect(MediaUtil.mediaEnded).toHaveBeenCalledTimes(1)
	})

	test('Paused event is received', () => {
		MediaUtil.mediaPaused = jest.fn()

		const component = mount(<YouTubePlayer />)
		component.instance().player = player

		component.instance().onStateChange({ data: 2 })

		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'user',
				action: 'paused'
			})
		)
		expect(MediaUtil.mediaPaused).toHaveBeenCalledTimes(1)
	})

	test('Buffering event is received', () => {
		MediaUtil.mediaBuffering = jest.fn()

		const component = mount(<YouTubePlayer />)
		component.instance().player = player

		// tests for the video buffering when unstarted
		component.instance().onStateChange({ data: 3 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'user',
				action: 'buffering'
			})
		)
		expect(MediaUtil.mediaBuffering).toHaveBeenCalledTimes(1)

		// modifies current state to mock the video buffering due to a skip
		component.instance().currentState.action = 'paused'
		component.instance().currentState.actor = 'user'

		component.instance().onStateChange({ data: 3 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'user',
				action: 'buffering'
			})
		)
		expect(MediaUtil.mediaBuffering).toHaveBeenCalledTimes(2)

		// modifies current state to mock the video randomly buffering
		component.instance().currentState.action = 'playing'
		component.instance().onStateChange({ data: 3 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'youtube',
				action: 'buffering'
			})
		)
		expect(MediaUtil.mediaBuffering).toHaveBeenCalledTimes(3)
	})

	test('Playing and SeekTo event is received', () => {
		MediaUtil.mediaPlayed = jest.fn()
		MediaUtil.mediaSeekTo = jest.fn()

		const component = mount(<YouTubePlayer />)
		component.instance().player = player

		// tests for the video playing
		component.instance().onStateChange({ data: 1 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'user',
				action: 'playing'
			})
		)
		expect(MediaUtil.mediaPlayed).toHaveBeenCalledTimes(1)

		// checks for possible double playing event
		component.instance().currentState.action = 'playing'
		component.instance().onStateChange({ data: 1 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'youtube',
				action: 'playing'
			})
		)
		expect(MediaUtil.mediaPlayed).toHaveBeenCalledTimes(2)

		// test video playing after buffering
		component.instance().currentState.action = 'buffering'
		component.instance().currentState.actor = 'user'
		component.instance().currentState.playheadPosition = 2

		component.instance().onStateChange({ data: 1 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'user',
				action: 'playing'
			})
		)
		expect(MediaUtil.mediaPlayed).toHaveBeenCalledTimes(3)

		// test video playing after buffering after a skip
		component.instance().currentState.action = 'buffering'
		component.instance().currentState.actor = 'youtube'
		component.instance().currentState.playheadPosition = 100

		component.instance().onStateChange({ data: 1 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'youtube',
				action: 'playing'
			})
		)
		expect(MediaUtil.mediaSeekTo).toHaveBeenCalledTimes(1)

		// test for a seekTo event
		component.instance().currentState.action = 'paused'
		component.instance().currentState.playheadPosition = 100

		component.instance().onStateChange({ data: 1 })
		expect(component.instance().currentState).toEqual(
			expect.objectContaining({
				actor: 'user',
				action: 'playing'
			})
		)
		expect(MediaUtil.mediaSeekTo).toHaveBeenCalledTimes(2)
	})

	test('Unload event is received', () => {
		MediaUtil.mediaUnloaded = jest.fn()

		let component = mount(<YouTubePlayer />)
		component.instance().currentState.action = 'ended'
		component.unmount()
		expect(MediaUtil.mediaUnloaded).not.toHaveBeenCalled()

		component = mount(<YouTubePlayer />)
		component.instance().currentState.action = 'playing'
		component.instance().player = player
		component.unmount()
		expect(MediaUtil.mediaUnloaded).toHaveBeenCalled()
	})
})
