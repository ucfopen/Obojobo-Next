const db = require('obojobo-express/server/db')
const logger = require('obojobo-express/server/logger')
const DraftSummary = require('./draft_summary')

class Collection {
	constructor({ id = null, title = '', user_id = null, created_at = null }) {
		this.id = id
		this.title = title
		this.userId = user_id
		this.createdAt = created_at
	}

	static fetchById(id) {
		return db
			.one(
				`
			SELECT
				id,
				title,
				user_id,
				created_at
			FROM repository_collections
			WHERE id = $[id]
			LIMIT 1
			`,
				{ id }
			)
			.then(selectResult => {
				return new Collection(selectResult)
			})
			.catch(error => {
				throw logger.logError('Collection fetchById Error', error)
			})
	}

	static createWithUser(userId, title = 'New Collection') {
		return db
			.one(
				`
					INSERT INTO repository_collections
						(title, group_type, user_id, visibility_type)
					VALUES
						($[title], 'tag', $[userId], 'private')
					RETURNING *`,
				{ title, userId }
			)
			.then(newCollection => {
				logger.info('user created collection', { userId, collectionId: newCollection.id, title })
				return new Collection(newCollection)
			})
	}

	static rename(id, newTitle, userId) {
		return db
			.one(
				`UPDATE repository_collections
				SET title = $[newTitle]
				WHERE id = $[id]
				RETURNING *`,
				{ id, newTitle }
			)
			.then(updatedCollection => {
				logger.info('collection renamed', {
					userId,
					id: updatedCollection.id,
					title: updatedCollection.title
				})
				return new Collection(updatedCollection)
			})
	}

	static addModule(collectionId, draftId, userId) {
		return db
			.none(
				`INSERT INTO repository_map_drafts_to_collections
					(draft_id, collection_id, user_id)
				VALUES
					($[draftId], $[collectionId], $[userId])
				`,
				{ collectionId, draftId, userId }
			)
			.then(() => {
				logger.info('user added module to collection', { userId, collectionId, draftId })
			})
	}

	static removeModule(collectionId, draftId, userId) {
		return db
			.none(
				`DELETE FROM repository_map_drafts_to_collections
				WHERE
					draft_id = $[draftId]
					AND collection_id = $[collectionId]
				`,
				{ collectionId, draftId }
			)
			.then(() => {
				logger.info('user removed module from collection', { userId, collectionId, draftId })
			})
	}

	static delete(id, userId) {
		return db
			.none(
				`UPDATE repository_collections
				SET deleted = TRUE
				WHERE id = $[id]`,
				{ id }
			)
			.then(() => {
				logger.info('collection deleted by user', { id, userId })
			})
	}

	loadRelatedDrafts() {
		const joinOn = `
			JOIN repository_map_drafts_to_collections
				ON repository_map_drafts_to_collections.draft_id = drafts.id
			JOIN repository_collections
				ON repository_collections.id = repository_map_drafts_to_collections.collection_id`

		const whereSQL = `repository_collections.id = $[collectionId]`

		return DraftSummary.fetchAndJoinWhere(joinOn, whereSQL, { collectionId: this.id })
			.then(draftSummaries => {
				this.drafts = draftSummaries
				return this
			})
			.catch(error => {
				throw logger.logError('loadModules Error', error)
			})
	}
}

module.exports = Collection
