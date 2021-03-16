const db = require('obojobo-express/server/db')
const logger = require('obojobo-express/server/logger')

const buildQueryWhere = whereSQL => {
	return `
		SELECT *
		FROM repository_collections
		WHERE deleted = FALSE
		AND ${whereSQL}
		ORDER BY title ASC
	`
}

class CollectionSummary {
	constructor({ id, title, group_type, user_id, created_at, visibility_type }) {
		this.id = id
		this.title = title
		this.groupType = group_type
		this.userId = user_id
		this.createdAt = created_at
		this.visibilityType = visibility_type
	}

	static fetchById(id) {
		return db
			.one(buildQueryWhere('id = $[id]'), { id })
			.then(CollectionSummary.resultsToObjects)
			.catch(error => {
				logger.error('fetchById Error', error.message)
				return Promise.reject('Error Loading CollectionSummary by id')
			})
	}

	static fetchByUserId(userId) {
		return CollectionSummary.fetchWhere(`visibility_type = 'private' AND user_id = $[userId]`, {
			userId
		})
	}

	static fetchWhere(whereSQL, queryValues) {
		return db
			.any(buildQueryWhere(whereSQL), queryValues)
			.then(CollectionSummary.resultsToObjects)
			.catch(error => {
				logger.error('fetchWhere Error', error.message, whereSQL, queryValues)
				return Promise.reject('Error loading CollectionSummary by query')
			})
	}

	static resultsToObjects(results) {
		if (Array.isArray(results)) {
			return results.map(object => {
				return new CollectionSummary(object)
			})
		}
		return new CollectionSummary(results)
	}
}

module.exports = CollectionSummary
