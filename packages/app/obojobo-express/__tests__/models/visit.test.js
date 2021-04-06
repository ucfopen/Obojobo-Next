jest.mock('../../server/db')
jest.mock('../../server/logger')
jest.mock('../../server/models/draft')
import Visit from '../../server/models/visit'
import logger from '../../server/logger'

const db = oboRequire('server/db')
const DraftDocument = require('../../server/models/draft')

describe('Visit Model', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		db.taskIf = jest.fn()
		db.taskIf.mockImplementation(cb => cb(db))
	})

	test('constructor builds expected values', () => {
		const visit = new Visit({ mockKey: 'mockValue', mockSecond: 'mockVal' })

		expect(visit).toHaveProperty('mockKey', 'mockValue')
		expect(visit).toHaveProperty('mockSecond', 'mockVal')
	})

	test('fetchById calls database and returns visit', () => {
		db.one.mockResolvedValueOnce({
			is_active: true,
			is_preview: true,
			draft_content_id: 'mockContentId'
		})

		Visit.fetchById('mockVisitId').then(result => {
			expect(result).toEqual({
				is_active: true,
				is_preview: true,
				draft_content_id: 'mockContentId'
			})
		})
	})

	test('draftDocument loads a draft and memoize it', async () => {
		const mockDocument = { id: 'mock' }
		DraftDocument.fetchDraftByVersion.mockResolvedValueOnce(mockDocument)

		const v = new Visit({ draft_id: 10, draft_content_id: 5 })

		const doc = await v.draftDocument

		// should return what DraftDocument.fetchDraftByVersion resolves with
		expect(doc).toStrictEqual(mockDocument)
		// sends the right arguments to DraftDocument.fetchDraftByVersion
		expect(DraftDocument.fetchDraftByVersion).toHaveBeenCalledWith(10, 5)
		// DraftDocument.fetchDraftByVersion only called once (useful for next test)
		expect(DraftDocument.fetchDraftByVersion).toHaveBeenCalledTimes(1)

		// get the document again
		const sameDoc = await v.draftDocument
		// DraftDocument.fetchDraftByVersion shouldn't have been called again if it was memoized
		expect(DraftDocument.fetchDraftByVersion).toHaveBeenCalledTimes(1)
		// verify we got the same result again
		expect(sameDoc).toStrictEqual(mockDocument)
	})

	test('fetchById allows you to return non active visits with argument', () => {
		db.one.mockResolvedValue({})
		Visit.fetchById('mockVisitId').then(() => {
			expect(db.one.mock.calls[0][0]).toEqual(expect.stringContaining('is_active = true'))
		})
		Visit.fetchById('mockVisitId', true).then(() => {
			expect(db.one.mock.calls[1][0]).toEqual(expect.stringContaining('is_active = true'))
		})
		Visit.fetchById('mockVisitId', false).then(() => {
			expect(db.one.mock.calls[2][0]).not.toEqual(expect.stringContaining('is_active = true'))
		})
	})

	test('fetchById logs errors', () => {
		db.one.mockRejectedValueOnce(new Error('mockError'))

		expect.hasAssertions()
		return Visit.fetchById('mockVisitId').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Visit fetchById Error', expect.any(Error))
			expect(error.message).toEqual('mockError')
		})
	})

	test('createVisit updates and inserts visit with expected values', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce([{ id: 'deactivated-visit-id' }])
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createVisit('user-id', 'draft-id', 'resource-link-id', 'launch-id').then(
			result => {
				expect(db.manyOrNone.mock.calls[0][1]).toEqual({
					draftId: 'draft-id',
					userId: 'user-id',
					resourceLinkId: 'resource-link-id'
				})
				expect(db.one.mock.calls[0][1]).toEqual({
					draftId: 'draft-id'
				})
				expect(db.one.mock.calls[1][1]).toEqual({
					draftId: 'draft-id',
					draftContentId: 'mocked-draft-content-id',
					userId: 'user-id',
					isScoreImportable: false,
					resourceLinkId: 'resource-link-id',
					launchId: 'launch-id',
					isPreview: false
				})
				expect(result).toEqual({
					visitId: 'resulting-visit-id',
					deactivatedVisitIds: ['deactivated-visit-id']
				})
			}
		)
	})

	test('createVisit updates and inserts visit with importableScores', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce([{ id: 'deactivated-visit-id' }])
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createVisit('user-id', 'draft-id', 'resource-link-id', 'launch-id', {
			isScoreImportable: true
		}).then(result => {
			expect(db.manyOrNone.mock.calls[0][1]).toEqual({
				draftId: 'draft-id',
				userId: 'user-id',
				resourceLinkId: 'resource-link-id'
			})
			expect(db.one.mock.calls[0][1]).toEqual({
				draftId: 'draft-id'
			})
			expect(db.one.mock.calls[1][1]).toEqual({
				draftId: 'draft-id',
				draftContentId: 'mocked-draft-content-id',
				userId: 'user-id',
				isScoreImportable: true,
				resourceLinkId: 'resource-link-id',
				launchId: 'launch-id',
				isPreview: false
			})
			expect(result).toEqual({
				visitId: 'resulting-visit-id',
				deactivatedVisitIds: ['deactivated-visit-id']
			})
		})
	})

	test('createPreviewVisit updates and inserts with expected values', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce([
			{ id: 'deactivated-visit-id' },
			{ id: 'deactivated-visit-id2' }
		])
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createPreviewVisit('user-id', 'draft-id').then(result => {
			expect(db.manyOrNone.mock.calls[0][1]).toEqual({
				draftId: 'draft-id',
				userId: 'user-id',
				resourceLinkId: 'preview'
			})
			expect(db.one.mock.calls[0][1]).toEqual({
				draftId: 'draft-id'
			})
			expect(db.one.mock.calls[1][1]).toEqual({
				draftId: 'draft-id',
				draftContentId: 'mocked-draft-content-id',
				userId: 'user-id',
				isScoreImportable: false,
				resourceLinkId: 'preview',
				launchId: null,
				isPreview: true
			})
			expect(result).toEqual({
				visitId: 'resulting-visit-id',
				deactivatedVisitIds: ['deactivated-visit-id', 'deactivated-visit-id2']
			})
		})
	})

	test('createPreviewVisit activates with no previous visit', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce(null)
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createPreviewVisit('user-id', 'draft-id').then(result => {
			expect(db.manyOrNone.mock.calls[0][1]).toEqual({
				draftId: 'draft-id',
				userId: 'user-id',
				resourceLinkId: 'preview'
			})
			expect(db.one.mock.calls[0][1]).toEqual({
				draftId: 'draft-id'
			})
			expect(db.one.mock.calls[1][1]).toEqual({
				draftId: 'draft-id',
				draftContentId: 'mocked-draft-content-id',
				userId: 'user-id',
				isScoreImportable: false,
				resourceLinkId: 'preview',
				launchId: null,
				isPreview: true
			})
			expect(result).toEqual({
				visitId: 'resulting-visit-id',
				deactivatedVisitIds: null
			})
		})
	})
})
