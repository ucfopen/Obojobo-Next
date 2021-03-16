'use strict'

let dbm
let type
let seed

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
	dbm = options.dbmigrate
	type = dbm.dataType
	seed = seedLink
}

exports.up = function(db) {
	return db
		.addColumn('repository_collections', 'visibility_type', {
			type: 'text',
			defaultValue: 'public'
		})
		.then(() => {
			db.addColumn('repository_collections', 'deleted', {
				type: 'boolean',
				defaultValue: false
			})
		})
}

exports.down = function(db) {
	return db.removeColumn('repository_collections', 'deleted').then(() => {
		db.removeColumn('repository_collections', 'visibility_type')
	})
}

exports._meta = {
	version: 1
}
