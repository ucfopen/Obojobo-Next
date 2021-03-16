const db = require('obojobo-express/server/db')
const CollectionModel = require('../models/collection')

const fetchAllCollectionsForDraft = async draftId => {
	const collections = await db.manyOrNone(
		`SELECT
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
		`,
		{ draftId }
	)

	return collections.map(c => new CollectionModel(c))
}

module.exports = {
	fetchAllCollectionsForDraft
}
