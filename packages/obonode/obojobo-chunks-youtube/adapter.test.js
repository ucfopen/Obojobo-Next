jest.mock('obojobo-document-engine/src/scripts/common/models/obo-model', () => {
	return require('obojobo-document-engine/__mocks__/obo-model-adapter-mock').default
})
import OboModel from 'obojobo-document-engine/src/scripts/common/models/obo-model'

import YoutubeAdapter from './adapter'

describe('Youtube adapter', () => {
	test('construct builds without attributes', () => {
		const model = new OboModel({})
		YoutubeAdapter.construct(model)
		expect(model.modelState).toMatchSnapshot()
	})

	test('construct builds with attributes', () => {
		const attrs = {
			content: {
				videoId: 'example_video_id',
				videoUrl: 'https://www.youtube.com/watch?v=example_video_id',
				startTime: 5,
				endTime: 10
			}
		}
		const model = new OboModel(attrs)
		YoutubeAdapter.construct(model, attrs)
		expect(model.modelState).toMatchSnapshot()
	})

	test('clone creates a copy', () => {
		const attrs = {
			content: {
				videoId: 'example_video_id',
				videoUrl: 'https://www.youtube.com/watch?v=example_video_id',
				startTime: 5,
				endTime: 10
			}
		}
		const a = new OboModel(attrs)
		const b = new OboModel({})

		YoutubeAdapter.construct(a, attrs)
		YoutubeAdapter.clone(a, b)

		expect(a.modelState).not.toBe(b.modelState)
		expect(a.modelState).toEqual(b.modelState)
	})

	test('toJSON builds a JSON representation', () => {
		const json = { content: {} }
		const attrs = {
			content: {
				videoId: 'example_video_id',
				videoUrl: 'https://www.youtube.com/watch?v=example_video_id',
				startTime: 5,
				endTime: 10
			}
		}
		const model = new OboModel(attrs)

		YoutubeAdapter.construct(model, attrs)
		YoutubeAdapter.toJSON(model, json)

		expect(json).toMatchSnapshot()
	})
})
