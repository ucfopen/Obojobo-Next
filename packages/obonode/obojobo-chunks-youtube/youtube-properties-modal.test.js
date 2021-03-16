import React from 'react'
import { mount } from 'enzyme'

import YouTubeProperties from './youtube-properties-modal'

describe('YouTubeProperties modal', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		jest.useFakeTimers()
	})

	test('YouTubeProperties component renders correctly', () => {
		const component = mount(<YouTubeProperties content={{}} />)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('YouTubeProperties component with values renders correctly', () => {
		const component = mount(
			<YouTubeProperties content={{ videoId: 'mock-id', startTime: 10, endTime: 20 }} />
		)
		const tree = component.html()

		expect(tree).toMatchSnapshot()
	})

	test('YouTubeProperties component focuses on first element', () => {
		const component = mount(<YouTubeProperties content={{}} />)

		component.instance().focusOnFirstElement()
		expect(component.html()).toMatchSnapshot()
	})

	test('Inputting a URL and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'mockVideoId'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'mockVideoId',
			startTime: null,
			endTime: null
		})
	})

	test('Inputting an embed code and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value:
						'<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: null,
			endTime: null
		})
	})

	test('Inputting a video ID and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'dQw4w9WgXcQ'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: null,
			endTime: null
		})
	})

	test('Inputting a URL with start times and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'https://www.youtube.com/v/dQw4w9WgXcQ?start=12'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: 12,
			endTime: null
		})
	})

	test('Inputting a URL with end times and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'https://www.youtube.com/v/dQw4w9WgXcQ?end=99'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: null,
			endTime: 99
		})
	})

	test('Inputting a URL with start and end times and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'https://www.youtube.com/v/dQw4w9WgXcQ?start=12&end=99'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: 12,
			endTime: 99
		})
	})

	test('Pasting a URL and clicking OK calls onConfirm with expected values', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('paste', {
				clipboardData: {
					getData: () => 'mockVideoId'
				}
			})

		jest.advanceTimersByTime(1)

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'mockVideoId',
			startTime: null,
			endTime: null
		})
	})

	test('Inputting a URL without start/end times (when start/end times are already defined) does not clear or modify the start/end times', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties
				onConfirm={onConfirm}
				content={{ videoId: 'dQw4w9WgXcQ', startTime: 10, endTime: 20 }}
			/>
		)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'https://www.youtube.com/v/vnm4R3gg-io'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'vnm4R3gg-io',
			startTime: 10,
			endTime: 20
		})
	})

	test('Inputting a URL WITH start/end times (when start/end times are already defined) DOES CLEAR the start/end times', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties
				onConfirm={onConfirm}
				content={{ videoId: 'dQw4w9WgXcQ', startTime: 10, endTime: 20 }}
			/>
		)

		// Input "mockVideoId" as the URL, then blur
		component
			.find('#obojobo-draft--chunks--youtube--video-url')
			.at(0)
			.simulate('change', {
				target: {
					value: 'https://www.youtube.com/v/vnm4R3gg-io?t=62'
				}
			})
			.simulate('blur')

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'vnm4R3gg-io',
			startTime: 62,
			endTime: null
		})
	})

	test('Inputting times in MM:SS format works fine', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties
				onConfirm={onConfirm}
				content={{ videoId: 'dQw4w9WgXcQ', startTime: 10, endTime: 200 }}
			/>
		)

		component
			.find('#obojobo-draft--chunks--youtube--start-time')
			.at(0)
			.simulate('change', {
				target: {
					value: '1:23'
				}
			})

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: 83,
			endTime: 200
		})
	})

	test('Clicking on the edit times button expands the UI', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties onConfirm={onConfirm} content={{ videoId: 'dQw4w9WgXcQ' }} />
		)

		component
			.find('.edit-times-button.show button')
			.at(0)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()
	})

	test('Clicking on the clear times button collapses the UI and clears out times', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties
				onConfirm={onConfirm}
				content={{ videoId: 'dQw4w9WgXcQ', startTime: 1, endTime: 2 }}
			/>
		)

		component
			.find('.edit-times-button.hide button')
			.at(0)
			.simulate('click')

		expect(component.html()).toMatchSnapshot()

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(onConfirm).toHaveBeenCalledWith({
			videoId: 'dQw4w9WgXcQ',
			startTime: null,
			endTime: null
		})
	})

	test('onConfirm not called if URL is missing', () => {
		const onConfirm = jest.fn()
		const component = mount(<YouTubeProperties onConfirm={onConfirm} content={{}} />)

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(onConfirm).not.toHaveBeenCalled()
	})

	test('onConfirm not called if time is in a bad format', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties onConfirm={onConfirm} content={{ videoId: 'dQw4w9WgXcQ', startTime: 1 }} />
		)

		component
			.find('#obojobo-draft--chunks--youtube--start-time')
			.at(0)
			.simulate('change', {
				target: {
					value: 'invalid-value'
				}
			})

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(onConfirm).not.toHaveBeenCalled()
	})

	test('onConfirm not called if endTime is less than startTime', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties
				onConfirm={onConfirm}
				content={{ videoId: 'dQw4w9WgXcQ', startTime: 100, endTime: 110 }}
			/>
		)

		component
			.find('#obojobo-draft--chunks--youtube--end-time')
			.at(0)
			.simulate('change', {
				target: {
					value: '12'
				}
			})

		// Click OK
		component
			.find('.controls button')
			.at(1)
			.simulate('click')

		expect(onConfirm).not.toHaveBeenCalled()
	})

	test('Submitting the form does not call onConfirm', () => {
		const onConfirm = jest.fn()
		const component = mount(
			<YouTubeProperties onConfirm={onConfirm} content={{ videoId: 'dQw4w9WgXcQ' }} />
		)

		component
			.find('form')
			.at(0)
			.simulate('submit')

		expect(onConfirm).not.toHaveBeenCalled()
	})
})
