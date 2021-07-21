jest.mock('../server/config')
jest.mock('../server/viewer/viewer_state', () => ({ set: jest.fn() }))
jest.mock('../server/obo_events', () => ({ on: jest.fn(), emit: jest.fn() }))
jest.mock('../server/models/visit')

const mockEvent = {
	userId: 'mockUserId',
	draftId: 'mockDraftId',
	contentId: 'mockContentId',
	visitId: 'mockVisitId',
	payload: {
		open: 'yep'
	}
}
let vs
let ve
let oboEvents
let VisitModel

describe('viewer events', () => {
	beforeAll(() => {})
	afterAll(() => {})
	beforeEach(() => {
		jest.resetModules()
		vs = oboRequire('server/viewer/viewer_state')
		oboEvents = oboRequire('server/obo_events')
		VisitModel = oboRequire('server/models/visit')
	})
	afterEach(() => {})

	test('registers expected events', () => {
		expect(oboEvents.on).not.toBeCalled()

		ve = oboRequire('server/viewer/viewer_events')
		expect(oboEvents.on).toBeCalledWith('client:nav:open', expect.any(Function))
		expect(oboEvents.on).toBeCalledWith('client:nav:close', expect.any(Function))
		expect(oboEvents.on).toBeCalledWith('client:nav:setRedAlert', expect.any(Function))
		expect(oboEvents.on).toHaveBeenCalledTimes(3)
	})

	test('executes next when included to support express middleware', () => {
		ve = oboRequire('server/viewer/viewer_events')
		const mockNext = jest.fn()
		ve({}, {}, mockNext)
		expect(mockNext).toBeCalled()
	})

	test('client:nav:open', () => {
		expect.hasAssertions()
		ve = oboRequire('server/viewer/viewer_events')

		const [eventName, callback] = oboEvents.on.mock.calls[0]
		expect(eventName).toBe('client:nav:open')
		expect(callback).toHaveLength(1) // callback has 1 argument

		VisitModel.fetchById.mockResolvedValueOnce({
			resource_link_id: 'mockResourceLinkId'
		})

		expect(vs.set).not.toHaveBeenCalled()
		return callback(mockEvent).then(() => {
			expect(vs.set).toBeCalledWith(
				'mockUserId',
				'mockDraftId',
				'mockContentId',
				'nav:isOpen',
				1,
				true,
				'mockResourceLinkId'
			)
		})
	})

	test('client:nav:close', () => {
		expect.hasAssertions()
		ve = oboRequire('server/viewer/viewer_events')

		const [eventName, callback] = oboEvents.on.mock.calls[1]
		expect(eventName).toBe('client:nav:close')
		expect(callback).toHaveLength(1) // callback has 1 argument

		VisitModel.fetchById.mockResolvedValueOnce({
			resource_link_id: 'mockResourceLinkId'
		})

		expect(vs.set).not.toHaveBeenCalled()
		return callback(mockEvent).then(() => {
			expect(vs.set).toBeCalledWith(
				'mockUserId',
				'mockDraftId',
				'mockContentId',
				'nav:isOpen',
				1,
				false,
				'mockResourceLinkId'
			)
		})
	})
})
