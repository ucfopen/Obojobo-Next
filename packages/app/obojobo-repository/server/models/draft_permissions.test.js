describe('DraftPermissions Model', () => {
	jest.mock('obojobo-express/server/db')
	jest.mock('obojobo-express/server/logger')
	jest.mock('./draft_summary')
	let db
	let logger
	let DraftPermissions
	let mockError

	const mockUserResults = {
		id: 1,
		first_name: 'Jeffrey',
		last_name: 'Lebowski',
		email: 'dude@obojobo.com',
		username: 'dude',
		created_at: 'whevever',
		roles: ['student'],
		extras: 'test-value'
	}

	beforeEach(() => {
		jest.resetModules()
		jest.resetAllMocks()
		db = require('obojobo-express/server/db')
		logger = require('obojobo-express/server/logger')
		DraftPermissions = require('./draft_permissions')
		mockError = new Error('mock-error')
		// mock logError to return the error itself
		logger.logError = jest.fn().mockImplementation((label, error) => error)
	})

	test('DraftPermissions has expected methods', () => {
		expect(DraftPermissions).toHaveProperty('addOwnerToDraft')
		expect(DraftPermissions).toHaveProperty('removeOwnerFromDraft')
		expect(DraftPermissions).toHaveProperty('getDraftOwners')
		expect(DraftPermissions).toHaveProperty('userHasPermissionToDraft')
	})

	test('addOwnerToDraft retrieves a data from the database', () => {
		expect.hasAssertions()

		db.none.mockResolvedValueOnce('mock-db-results')

		return DraftPermissions.addOwnerToDraft('MDID', 'MUID').then(model => {
			expect(model).toBe('mock-db-results')
			const [query, options] = db.none.mock.calls[0]
			expect(query).toContain('INSERT INTO repository_map_user_to_draft')
			expect(options).toEqual({
				userId: 'MUID',
				draftId: 'MDID'
			})
		})
	})

	test('addOwnerToDraft throws and logs error', () => {
		expect.hasAssertions()
		db.none.mockRejectedValueOnce(mockError)

		return DraftPermissions.addOwnerToDraft('MDID', 'MUID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error addOwnerToDraft', mockError)
			expect(error).toBe(mockError)
		})
	})

	test('removeOwnerFromDraft retrieves a data from the database', () => {
		expect.hasAssertions()

		db.none.mockResolvedValueOnce('mock-db-results')

		return DraftPermissions.removeOwnerFromDraft('MDID', 'MUID').then(model => {
			expect(model).toBe('mock-db-results')
			const [query, options] = db.none.mock.calls[0]
			expect(query).toContain('DELETE')
			expect(query).toContain('FROM repository_map_user_to_draft')
			expect(options).toEqual({
				userId: 'MUID',
				draftId: 'MDID'
			})
		})
	})

	test('removeOwnerFromDraft throws and logs error', () => {
		expect.hasAssertions()
		db.none.mockRejectedValueOnce(mockError)

		return DraftPermissions.removeOwnerFromDraft('MDID', 'MUID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error removeOwnerFromDraft', mockError)
			expect(error).toBe(mockError)
		})
	})

	test('getDraftOwners retrieves a data from the database', () => {
		expect.hasAssertions()

		db.manyOrNone.mockResolvedValueOnce([mockUserResults])

		return DraftPermissions.getDraftOwners('MDID').then(users => {
			expect(users).toHaveLength(1)
			expect(users[0]).toMatchInlineSnapshot(`
			Object {
			  "avatarUrl": "https://secure.gravatar.com/avatar/340b0dabf1ff06d15fd57dfe757bdbde?s=120&d=retro",
			  "firstName": "Jeffrey",
			  "id": 1,
			  "lastName": "Lebowski",
			  "roles": Array [
			    "student",
			  ],
			  "username": "dude",
			}
		`)
			const [query, options] = db.manyOrNone.mock.calls[0]
			expect(query).toContain('SELECT')
			expect(query).toContain('FROM repository_map_user_to_draft')
			expect(options).toEqual({
				draftId: 'MDID'
			})
		})
	})

	test('getDraftOwners throws and logs error', () => {
		expect.hasAssertions()
		db.manyOrNone.mockRejectedValueOnce(mockError)

		return DraftPermissions.getDraftOwners('MDID', 'MUID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error getDraftOwners', mockError)
			expect(error).toBe(mockError)
		})
	})

	test('userHasPermissionToDraft retrieves a data from the database', () => {
		expect.hasAssertions()

		db.oneOrNone.mockResolvedValueOnce('mock-db-results')

		return DraftPermissions.userHasPermissionToDraft('MUID', 'MDID').then(hasPermissions => {
			expect(hasPermissions).toBe(true)
			const [query, options] = db.oneOrNone.mock.calls[0]
			expect(query).toContain('SELECT')
			expect(query).toContain('FROM repository_map_user_to_draft')
			expect(options).toEqual({
				userId: 'MUID',
				draftId: 'MDID'
			})
		})
	})

	test('userHasPermissionToDraft retrieves a data from the database', () => {
		expect.hasAssertions()

		db.oneOrNone.mockResolvedValueOnce(null)

		return DraftPermissions.userHasPermissionToDraft('MUID', 'MDID').then(hasPermissions => {
			expect(hasPermissions).toBe(false)
			const [query, options] = db.oneOrNone.mock.calls[0]
			expect(query).toContain('SELECT')
			expect(query).toContain('FROM repository_map_user_to_draft')
			expect(options).toEqual({
				userId: 'MUID',
				draftId: 'MDID'
			})
		})
	})

	test('userHasPermissionToDraft throws and logs error', () => {
		expect.hasAssertions()
		db.oneOrNone.mockRejectedValueOnce(mockError)

		return DraftPermissions.userHasPermissionToDraft('MUID', 'MDID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error userHasPermissionToDraft', mockError)
			expect(error).toBe(mockError)
		})
	})

	test('draftIsPublic retrieves a data from the database', () => {
		expect.hasAssertions()

		db.oneOrNone.mockResolvedValueOnce(null)

		return DraftPermissions.draftIsPublic('MDID').then(hasPermissions => {
			expect(hasPermissions).toBe(false)
			const [query, options] = db.oneOrNone.mock.calls[0]
			expect(query).toContain('SELECT')
			expect(query).toContain('FROM repository_map_drafts_to_collections')
			expect(options).toEqual({
				draftId: 'MDID',
				publicLibCollectionId: '00000000-0000-0000-0000-000000000000'
			})
		})
	})

	test('draftIsPublic throws and logs error', () => {
		expect.hasAssertions()
		db.oneOrNone.mockRejectedValueOnce(mockError)

		return DraftPermissions.draftIsPublic('MUID', 'MDID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error draftIsPublic', mockError)
			expect(error).toBe(mockError)
		})
	})

	test.each`
		draftIsPublic       | userHasPermissionToDraft | expected
		${null}             | ${'mock-db-result'}      | ${true}
		${'mock-db-result'} | ${null}                  | ${true}
		${null}             | ${null}                  | ${false}
		${'mock-db-result'} | ${'mock-db-result'}      | ${true}
	`(
		'userHasPermissionToCopy returns $expected with db results $draftIsPublic and $userHasPermissionToDraft',
		({ draftIsPublic, userHasPermissionToDraft, expected }) => {
			expect.hasAssertions()

			db.oneOrNone.mockResolvedValueOnce(draftIsPublic) // draftIsPublic call
			db.oneOrNone.mockResolvedValueOnce(userHasPermissionToDraft) // userHasPermissionToDraft call

			return DraftPermissions.userHasPermissionToCopy('MUID', 'MDID').then(hasPermissions => {
				expect(hasPermissions).toBe(expected)

				const [isPublicQuery, isPublicOptions] = db.oneOrNone.mock.calls[0]
				expect(isPublicQuery).toContain('SELECT')
				expect(isPublicQuery).toContain('FROM repository_map_drafts_to_collections')
				expect(isPublicOptions).toEqual({
					draftId: 'MDID',
					publicLibCollectionId: '00000000-0000-0000-0000-000000000000'
				})

				const [hasPermsQuery, hasPermsOptions] = db.oneOrNone.mock.calls[1]
				expect(hasPermsQuery).toContain('SELECT')
				expect(hasPermsQuery).toContain('FROM repository_map_user_to_draft')
				expect(hasPermsOptions).toEqual({
					draftId: 'MDID',
					userId: 'MUID'
				})
			})
		}
	)

	test('userHasPermissionToCopy throws and logs error', () => {
		expect.hasAssertions()
		db.oneOrNone.mockResolvedValueOnce('mock-db-results') // draftIsPublic call
		db.oneOrNone.mockRejectedValueOnce(mockError) // userHasPermissionToDraft call

		return DraftPermissions.userHasPermissionToCopy('MUID', 'MDID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error userHasPermissionToCopy', mockError)
			expect(error).toBe(mockError)
		})
	})

	test('userHasPermissionToCopy throws and logs error', () => {
		expect.hasAssertions()
		db.oneOrNone.mockRejectedValueOnce(mockError) // draftIsPublic call
		db.oneOrNone.mockResolvedValueOnce('mock-db-results') // userHasPermissionToDraft call

		return DraftPermissions.userHasPermissionToCopy('MUID', 'MDID').catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error userHasPermissionToCopy', mockError)
			expect(error).toBe(mockError)
		})
	})

	test('userHasPermissionToCollection returns true when the user has permission', () => {
		expect.hasAssertions()
		db.oneOrNone.mockResolvedValueOnce(mockUserResults.id)

		return DraftPermissions.userHasPermissionToCollection(
			mockUserResults.id,
			'mockCollectionId'
		).then(response => {
			expect(db.oneOrNone).toHaveBeenCalledTimes(1)
			expect(db.oneOrNone).toHaveBeenCalledWith(expect.any(String), {
				userId: mockUserResults.id,
				collectionId: 'mockCollectionId'
			})
			expect(response).toBe(true)
		})
	})

	test('userHasPermissionToCollection returns false when the user does not have permission', () => {
		expect.hasAssertions()
		db.oneOrNone.mockResolvedValueOnce(null)

		return DraftPermissions.userHasPermissionToCollection(
			mockUserResults.id,
			'mockCollectionId'
		).then(response => {
			expect(db.oneOrNone).toHaveBeenCalledTimes(1)
			expect(db.oneOrNone).toHaveBeenCalledWith(expect.any(String), {
				userId: mockUserResults.id,
				collectionId: 'mockCollectionId'
			})
			expect(response).toBe(false)
		})
	})

	test('userHasPermissionToCollection handles error', () => {
		expect.hasAssertions()
		db.oneOrNone.mockRejectedValueOnce(mockError)

		return DraftPermissions.userHasPermissionToCollection(
			mockUserResults.id,
			'mockCollectionId'
		).catch(error => {
			expect(logger.logError).toHaveBeenCalledWith('Error userHasPermissionToCollection', mockError)
			expect(error).toBe(mockError)
		})
	})
})
