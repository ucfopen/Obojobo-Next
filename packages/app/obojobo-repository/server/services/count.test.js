describe('Count Services', () => {
	jest.mock('obojobo-express/server/db')

	let db
	let CountServices

	beforeEach(() => {
		jest.resetModules()
		jest.resetAllMocks()
		db = require('obojobo-express/server/db')
		CountServices = require('./count')
	})
	afterEach(() => {})

	test('getUserModuleCount returns a list of collection objects', () => {
		db.one = jest.fn()
		db.one.mockResolvedValueOnce({ count: 10 })

		expect.hasAssertions()

		const queryString = `
		SELECT COUNT(drafts.id) AS count
		FROM drafts
		INNER JOIN repository_map_user_to_draft
			ON repository_map_user_to_draft.draft_id = drafts.id
		WHERE drafts.deleted = FALSE
		AND repository_map_user_to_draft.user_id = $[userId]
	`

		return CountServices.getUserModuleCount('mockUserId').then(response => {
			expect(db.one).toHaveBeenCalledWith(queryString, { userId: 'mockUserId' })
			expect(response).toBe(10)
		})
	})
})
