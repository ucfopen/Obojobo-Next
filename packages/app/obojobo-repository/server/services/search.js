/* eslint-disable no-console */
const db = require('obojobo-express/server/db')
const UserModel = require('obojobo-express/server/models/user')

const searchForUserByString = async searchString => {
	return db
		.manyOrNone(
			`SELECT
			id,
			first_name AS "firstName",
			last_name AS "lastName",
			email,
			username,
			created_at AS "createdAt",
			roles
		FROM users
		WHERE obo_immutable_concat_ws(' ', first_name, last_name) ILIKE $[search]
		OR email ILIKE $[search]
		OR username ILIKE $[search]
		ORDER BY first_name, last_name
		LIMIT 25`,
			{ search: `%${searchString}%` }
		)
		.then(users => users.map(u => new UserModel(u)))
}

module.exports = {
	searchForUserByString
}
