describe('Collection Services', () => {
	jest.mock('obojobo-express/server/db')

	let db
	const Collection = require('../models/collection')
	let CollectionServices

	const mockRawCollection = {
		id: 'mockCollectionId',
		title: 'mockCollectionTitle',
		user_id: 0,
		created_at: new Date().toISOString()
	}

	beforeEach(() => {
		jest.resetAllMocks()
		db = require('obojobo-express/server/db')
		CollectionServices = require('./collections')
	})
	afterEach(() => {})

	test('fetchAllCollectionsForDraft returns a list of Collection objects', () => {
		const mockResponse = [
			{ ...mockRawCollection },
			{ ...mockRawCollection, id: 'mockCollectionId2' },
			{ ...mockRawCollection, id: 'mockCollectionId3' }
		]

		db.manyOrNone = jest.fn()
		db.manyOrNone.mockResolvedValueOnce(mockResponse)

		expect.hasAssertions()
		const queryString = `SELECT
			repository_collections.id,
			repository_collections.title,
			repository_collections.user_id,
			repository_collections.created_at
		FROM repository_map_drafts_to_collections
		JOIN repository_collections
			ON repository_map_drafts_to_collections.collection_id = repository_collections.id
		WHERE
			repository_collections.deleted = FALSE
			AND repository_map_drafts_to_collections.draft_id = $[draftId]
		ORDER BY repository_collections.title
		`

		return CollectionServices.fetchAllCollectionsForDraft('mockDraftId').then(response => {
			expect(db.manyOrNone).toHaveBeenCalledWith(queryString, { draftId: 'mockDraftId' })

			expect(response[0]).toBeInstanceOf(Collection)
			expect(response[0].id).toBe('mockCollectionId')
			expect(response[0].title).toBe('mockCollectionTitle')
			expect(response[0].userId).toBe(mockRawCollection.user_id)
			expect(response[0].createdAt).toBe(mockRawCollection.created_at)

			expect(response[1]).toBeInstanceOf(Collection)
			expect(response[1].id).toBe('mockCollectionId2')

			expect(response[2]).toBeInstanceOf(Collection)
			expect(response[2].id).toBe('mockCollectionId3')
		})
	})
})
