const db = require('obojobo-express/server/db')
const logger = require('obojobo-express/server/logger')

const buildQuery = (whereSQL, joinSQL = '', limitSQL = '') => {
	return `
		SELECT
			DISTINCT drafts_content.draft_id AS draft_id,
			last_value(drafts_content.created_at) OVER wnd as "updated_at",
			first_value(drafts_content.created_at) OVER wnd as "created_at",
			last_value(drafts_content.id) OVER wnd as "latest_version",
			count(drafts_content.id) OVER wnd as revision_count,
			COALESCE(last_value(drafts_content.content->'content'->>'title') OVER wnd, '') as "title",
			drafts.user_id AS user_id,
			'visual' AS editor
		FROM drafts
		JOIN drafts_content
			ON drafts_content.draft_id = drafts.id
		${joinSQL}
		WHERE drafts.deleted = FALSE
		AND ${whereSQL}
		WINDOW wnd AS (
			PARTITION BY drafts_content.draft_id ORDER BY drafts_content.created_at
			ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
		)
		ORDER BY updated_at DESC
		${limitSQL}
	`
}

class DraftSummary {
	constructor({
		draft_id,
		latest_version,
		title,
		user_id,
		created_at,
		updated_at,
		revision_count,
		editor,
		content,
		id,
		first_name,
		last_name
	}) {
		this.draftId = draft_id
		this.title = title
		this.userId = user_id
		this.createdAt = created_at
		this.updatedAt = updated_at
		this.latestVersion = latest_version
		this.editor = editor
		this.json = content
		this.revisionId = id

		if (first_name && last_name) this.userFullName = `${first_name} ${last_name}`
		if (revision_count) this.revisionCount = Number(revision_count)
	}

	static fetchById(id) {
		return db
			.one(buildQuery('drafts.id = $[id]'), { id })
			.then(DraftSummary.resultsToObjects)
			.catch(error => {
				throw logger.logError('DraftSummary fetchById Error', error)
			})
	}

	static fetchByUserId(userId) {
		return DraftSummary.fetchAndJoinWhere(
			`JOIN repository_map_user_to_draft
				ON repository_map_user_to_draft.draft_id = drafts.id`,
			`repository_map_user_to_draft.user_id = $[userId]`,
			{ userId }
		)
	}

	static fetchRecentByUserId(userId) {
		return DraftSummary.fetchAndJoinWhereLimit(
			`JOIN repository_map_user_to_draft
				ON repository_map_user_to_draft.draft_id = drafts.id`,
			`repository_map_user_to_draft.user_id = $[userId]`,
			'LIMIT 5',
			{ userId }
		)
	}

	static fetchAllInCollection(collectionId) {
		return DraftSummary.fetchAndJoinWhere(
			`JOIN repository_map_drafts_to_collections
				ON repository_map_drafts_to_collections.draft_id = drafts.id`,
			`repository_map_drafts_to_collections.collection_id = $[collectionId]`,
			{ collectionId }
		)
	}

	static fetchAllInCollectionForUser(collectionId, userId) {
		return DraftSummary.fetchAndJoinWhere(
			`JOIN repository_map_drafts_to_collections
				ON repository_map_drafts_to_collections.draft_id = drafts.id
			JOIN repository_map_user_to_draft
				ON repository_map_user_to_draft.draft_id = drafts.id`,
			`repository_map_drafts_to_collections.collection_id = $[collectionId]
			AND repository_map_user_to_draft.user_id = $[userId]`,
			{ collectionId, userId }
		)
	}

	static fetchByDraftTitleAndUser(searchString, userId) {
		searchString = `%${searchString}%`
		const whereSQL = `repository_map_user_to_draft.user_id = $[userId]`

		const joinSQL = `JOIN repository_map_user_to_draft
			ON repository_map_user_to_draft.draft_id = drafts.id`

		const innerQuery = buildQuery(whereSQL, joinSQL)
		const query = `
			SELECT inner_query.*
			FROM (
				${innerQuery}
			) AS inner_query
			WHERE inner_query.title ILIKE $[searchString]
		`

		const queryValues = { userId, searchString }

		return db
			.any(query, queryValues)
			.then(DraftSummary.resultsToObjects)
			.catch(error => {
				logger.error('fetchByDraftTitleAndUser Error', error.message, query, queryValues)
				return Promise.reject('Error loading DraftSummary by query')
			})
	}

	static fetchAndJoinWhereLimit(joinSQL, whereSQL, limitSQL, queryValues) {
		return db
			.any(buildQuery(whereSQL, joinSQL, limitSQL), queryValues)
			.then(DraftSummary.resultsToObjects)
			.catch(error => {
				logger.error(
					'fetchAndJoinWhereLimit Error',
					error.message,
					joinSQL,
					whereSQL,
					limitSQL,
					queryValues
				)
				return Promise.reject('Error loading DraftSummary by query')
			})
	}

	static fetchAndJoinWhere(joinSQL, whereSQL, queryValues) {
		return db
			.any(buildQuery(whereSQL, joinSQL), queryValues)
			.then(DraftSummary.resultsToObjects)
			.catch(error => {
				throw logger.logError('Error loading DraftSummary by query', error)
			})
	}

	static fetchWhere(whereSQL, queryValues) {
		return db
			.any(buildQuery(whereSQL), queryValues)
			.then(DraftSummary.resultsToObjects)
			.catch(error => {
				throw logger.logError('Error loading DraftSummary by query', error)
			})
	}

	static async fetchAllDraftRevisions(draftId, afterVersionId = null, count = 50) {
		const MAX_COUNT = 100
		const MIN_COUNT = 10
		count = Math.max(Math.min(MAX_COUNT, count), MIN_COUNT)
		count += 1 // add 1 so we'll know if there are more to get after count

		let whereAfterversion = ''
		// if afterVersionId is provided, we'll reduce
		// the results to any revisions saved before afterVersionId
		if (afterVersionId) {
			whereAfterversion = `
				AND drafts_content.created_at < (
					SELECT created_at FROM drafts_content WHERE id = $[afterVersionId]
				)`
		}

		const query = `
			SELECT
				drafts_content.id,
				drafts_content.draft_id,
				drafts_content.created_at,
				drafts_content.user_id,
				users.first_name,
				users.last_name
			FROM drafts_content
			JOIN users
				ON drafts_content.user_id = users.id
			WHERE
				drafts_content.draft_id = $[draftId]
				${whereAfterversion}
			ORDER BY
				drafts_content.created_at DESC
			LIMIT $[count];
		`

		try {
			const results = await db.any(query, { draftId, afterVersionId, count })
			const hasMoreResults = results.length === count
			if (hasMoreResults) results.pop() // remove last element
			const revisions = DraftSummary.resultsToObjects(results)
			return { revisions, hasMoreResults }
		} catch (error) {
			logger.error('fetchAllDraftRevisions', error.message, query, draftId)
			return Promise.reject('Error loading DraftSummary by query')
		}
	}

	static fetchDraftRevisionById(draftId, revisionId) {
		const query = `
			SELECT
				drafts_content.id,
				drafts_content.draft_id,
				drafts_content.created_at,
				drafts_content.content,
				drafts_content.user_id,
				users.first_name,
				users.last_name
			FROM drafts_content
			JOIN users
				ON drafts_content.user_id = users.id
			WHERE drafts_content.draft_id = $[draftId] AND drafts_content.id = $[revisionId]
		`

		return db
			.one(query, { draftId, revisionId })
			.then(DraftSummary.resultsToObjects)
			.catch(error => {
				logger.error('fetchDraftRevisionById', error.message, query, { draftId, revisionId })
				return Promise.reject('Error loading DraftSummary by query')
			})
	}

	static resultsToObjects(results) {
		if (Array.isArray(results)) {
			return results.map(object => {
				return new DraftSummary(object)
			})
		}
		return new DraftSummary(results)
	}
}

module.exports = DraftSummary
