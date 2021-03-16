const db = require('obojobo-express/server/db')
const User = require('obojobo-express/server/models/user')
const logger = require('obojobo-express/server/logger')
const publicLibCollectionId = require('../../shared/publicLibCollectionId')

class DraftPermissions {
	static addOwnerToDraft(draftId, userId) {
		return db
			.none(
				`INSERT INTO repository_map_user_to_draft
			(draft_id, user_id)
			VALUES($[draftId], $[userId])
			ON CONFLICT DO NOTHING`,
				{ userId, draftId }
			)
			.catch(error => {
				throw logger.logError('Error addOwnerToDraft', error)
			})
	}

	static removeOwnerFromDraft(draftId, userId) {
		return db
			.none(
				`DELETE
			FROM repository_map_user_to_draft
			WHERE draft_id = $[draftId]
			AND user_id = $[userId]`,
				{ userId, draftId }
			)
			.catch(error => {
				throw logger.logError('Error removeOwnerFromDraft', error)
			})
	}

	static getDraftOwners(draftId) {
		return db
			.manyOrNone(
				`SELECT
				users.id,
				users.first_name,
				users.last_name,
				users.email,
				users.username,
				users.created_at,
				users.roles
			FROM repository_map_user_to_draft
			JOIN users
				ON users.id = user_id
			WHERE draft_id = $[draftId]
			ORDER BY users.first_name, users.last_name`,
				{ draftId }
			)
			.then(results => {
				return results.map(r => User.dbResultToModel(r))
			})
			.catch(error => {
				throw logger.logError('Error getDraftOwners', error)
			})
	}

	// returns a boolean
	static async userHasPermissionToDraft(userId, draftId) {
		try {
			const result = await db.oneOrNone(
				`SELECT user_id
				FROM repository_map_user_to_draft
				WHERE draft_id = $[draftId]
				AND user_id = $[userId]`,
				{ userId, draftId }
			)

			// oneOrNone returns null when there are no results
			return result !== null
		} catch (error) {
			throw logger.logError('Error userHasPermissionToDraft', error)
		}
	}

	// returns a boolean
	static async userHasPermissionToCopy(userId, draftId) {
		try {
			const results = await Promise.all([
				DraftPermissions.draftIsPublic(draftId),
				DraftPermissions.userHasPermissionToDraft(userId, draftId)
			])

			return results[0] === true || results[1] === true
		} catch (error) {
			throw logger.logError('Error userHasPermissionToCopy', error)
		}
	}

	// returns a boolean
	static async draftIsPublic(draftId) {
		try {
			const result = await db.oneOrNone(
				`
				SELECT draft_id
				FROM repository_map_drafts_to_collections
				WHERE draft_id = $[draftId] AND collection_id = $[publicLibCollectionId]
				`,
				{ draftId, publicLibCollectionId }
			)

			return result !== null
		} catch (error) {
			throw logger.logError('Error draftIsPublic', error)
		}
	}

	// returns a boolean
	static async userHasPermissionToCollection(userId, collectionId) {
		try {
			const result = await db.oneOrNone(
				`SELECT user_id
				FROM repository_collections
				WHERE id = $[collectionId]
				AND user_id = $[userId]`,
				{ userId, collectionId }
			)

			return result !== null
		} catch (error) {
			throw logger.logError('Error userHasPermissionToCollection', error)
		}
	}
}

module.exports = DraftPermissions
