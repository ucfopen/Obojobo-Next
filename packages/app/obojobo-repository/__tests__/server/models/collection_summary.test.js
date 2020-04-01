describe('CollectionSummary Model', () => {
	jest.mock('obojobo-express/server/db')
	jest.mock('obojobo-express/server/logger')
	let db
	let logger
	let CollectionSummary

	const mockRawCollectionSummary = {
		id: 'whatever',
		title: 'whatever',
		group_type: 'tag',
		user_id: 0,
		created_at: new Date().toISOString(),
		visibility_type: 'private'
	}

	beforeEach(() => {
		jest.resetModules()
		jest.resetAllMocks()
		db = require('obojobo-express/server/db')
		logger = require('obojobo-express/server/logger')

		CollectionSummary = require('../../../server/models/collection_summary')
	})
	afterEach(() => {})

	//NOTE:
	// This is just the CollectionSummary non-public 'buildQuery' method.
	// Not sure if there's a good way of exposing that, so will just use this.
	const queryBuilder = whereSQL =>
		`
		SELECT *
		FROM repository_collections
		WHERE deleted = FALSE
		AND ${whereSQL}
		ORDER BY title ASC
	`

	const checkAgainstMockRawSummary = summary => {
		expect(summary).toBeInstanceOf(CollectionSummary)
		expect(summary.id).toBe('whatever')
		expect(summary.title).toBe('whatever')
		expect(summary.groupType).toBe('tag')
		expect(summary.createdAt).toBe(mockRawCollectionSummary.created_at)
		expect(summary.visibilityType).toBe('private')
	}

	test('fetchById generates the correct query and returns a CollectionSummary object', () => {
		db.one = jest.fn()
		db.one.mockResolvedValueOnce(mockRawCollectionSummary)

		const query = queryBuilder('id = $[id]')

		CollectionSummary.fetchById('whatever').then(summary => {
			expect(db.one).toHaveBeenCalledWith(query, { id: 'whatever' })
			checkAgainstMockRawSummary(summary)
		})
	})

	test('fetchById returns error when no match is found in the database', () => {
		logger.error = jest.fn()

		expect.hasAssertions()

		db.one.mockRejectedValueOnce(new Error('not found in db'))

		return CollectionSummary.fetchById('whatever').catch(err => {
			expect(logger.error).toHaveBeenCalledWith('fetchById Error', 'not found in db')
			expect(err).toBe('Error Loading CollectionSummary by id')
		})
	})

	test('fetchByUserId generates the correct query and returns a CollectionSummary object', () => {
		db.any = jest.fn()
		db.any.mockResolvedValueOnce(mockRawCollectionSummary)

		const whereSQL = `visibility_type = 'private' AND user_id = $[userId] AND deleted = FALSE`
		const query = queryBuilder(whereSQL)

		return CollectionSummary.fetchByUserId(0).then(summary => {
			expect(db.any).toHaveBeenCalledWith(query, { userId: 0 })
			checkAgainstMockRawSummary(summary)
		})
	})

	test('fetchWhere catches database errors', () => {
		expect.hasAssertions()

		db.any.mockRejectedValueOnce(new Error('not found in db'))

		const whereSQL = ''
		const mockQueryValues = { id: 'whatever' }

		return CollectionSummary.fetchWhere(whereSQL, mockQueryValues).catch(err => {
			expect(logger.error).toHaveBeenCalledWith(
				'fetchWhere Error',
				'not found in db',
				whereSQL,
				mockQueryValues
			)
			expect(err).toBe('Error loading CollectionSummary by query')
		})
	})

	test('resultsToObjects renders a list of raw query results into CollectionSummary objects', () => {
		const results = [
			{ ...mockRawCollectionSummary },
			{ ...mockRawCollectionSummary, id: 'whatever-2' },
			{ ...mockRawCollectionSummary, id: 'whatever-3' }
		]

		const summaries = CollectionSummary.resultsToObjects(results)

		expect(summaries.length).toBe(3)
		expect(summaries[0].id).toBe('whatever')
		expect(summaries[1].id).toBe('whatever-2')
		expect(summaries[2].id).toBe('whatever-3')
	})
})