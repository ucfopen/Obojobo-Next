const db = require('obojobo-express/server/db')

const getUserModuleCount = async userId => {
	const countQuery = await db.one(
		`
		SELECT COUNT(drafts.id) AS count
		FROM drafts
		INNER JOIN repository_map_user_to_draft
			ON repository_map_user_to_draft.draft_id = drafts.id
		WHERE drafts.deleted = FALSE
		AND repository_map_user_to_draft.user_id = $[userId]
	`,
		{ userId }
	)

	return parseInt(countQuery.count, 10)
}

module.exports = {
	getUserModuleCount
}
