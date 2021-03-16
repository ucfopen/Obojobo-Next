const router = require('express').Router() //eslint-disable-line new-cap
const Collection = require('../models/collection')
const DraftSummary = require('../models/draft_summary')
const UserModel = require('obojobo-express/server/models/user')
const { webpackAssetPath } = require('obojobo-express/server/asset_resolver')
const DraftPermissions = require('../models/draft_permissions')
const GeoPattern = require('geopattern')
const {
	checkValidationRules,
	requireDraftId,
	getCurrentUser
} = require('obojobo-express/server/express_validators')

const publicLibCollectionId = require('../../shared/publicLibCollectionId')

router
	.route('/')
	.get(getCurrentUser)
	.get((req, res) => {
		const props = {
			currentUser: req.currentUser,
			// must use webpackAssetPath for all webpack assets to work in dev and production!
			appCSSUrl: webpackAssetPath('homepage.css')
		}
		res.render('pages/page-homepage.jsx', props)
	})

// Module Images
router.route('/library/module-icon/:moduleId').get((req, res) => {
	// @TODO: when user's can change these images,
	// we'll need to use a smarter etag

	// use etag to avoid doing work, if the browser
	// sends an if-none-match of this object's etag
	// it already has it cached, just return 304 now
	if (req.headers['if-none-match'] === req.params.moduleId) {
		res.status(304)
		res.send()
		return
	}

	const pattern = GeoPattern.generate(req.params.moduleId)
	res.setHeader('ETag', req.params.moduleId)
	res.setHeader('Content-Type', 'image/svg+xml')
	res.send(pattern.toString())
})

router
	.route('/login')
	.get(getCurrentUser)
	.get((req, res) => {
		const props = {
			currentUser: req.currentUser,
			// must use webpackAssetPath for all webpack assets to work in dev and production!
			appCSSUrl: webpackAssetPath('repository.css')
		}
		res.render('pages/page-login.jsx', props)
	})

router
	.route('/library')
	.get(getCurrentUser)
	.get((req, res) => {
		return Collection.fetchById(publicLibCollectionId)
			.then(collection => {
				return collection.loadRelatedDrafts()
			})
			.then(collection => {
				const props = {
					collections: [collection],
					page: 1,
					pageCount: 1,
					currentUser: req.currentUser,
					// must use webpackAssetPath for all webpack assets to work in dev and production!
					appCSSUrl: webpackAssetPath('repository.css')
				}
				res.render('pages/page-library.jsx', props)
			})
			.catch(res.unexpected)
	})

router
	.route('/library/:draftId')
	.get([requireDraftId, getCurrentUser, checkValidationRules])
	.get(async (req, res) => {
		let module
		try {
			module = await DraftSummary.fetchById(req.params.draftId)
		} catch (e) {
			res.missing()
			return
		}

		try {
			let owner = { firstName: 'Obojobo', lastName: 'Next' }
			if (module.userId !== '0') {
				owner = await UserModel.fetchById(module.userId)
			}

			const canCopy = await DraftPermissions.userHasPermissionToCopy(
				req.currentUser.id,
				module.draftId
			)

			const props = {
				module,
				owner,
				currentUser: req.currentUser,
				// must use webpackAssetPath for all webpack assets to work in dev and production!
				appCSSUrl: webpackAssetPath('repository.css'),
				appJsUrl: webpackAssetPath('page-module.js'),
				canCopy
			}
			res.render('pages/page-module-server.jsx', props)
		} catch (e) {
			res.unexpected(e)
		}
	})

module.exports = router
