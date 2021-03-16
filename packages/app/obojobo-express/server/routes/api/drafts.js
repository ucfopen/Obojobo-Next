const express = require('express')
const fs = require('fs')
const router = express.Router()
const CollectionModel = require('obojobo-repository/server/models/collection')
const DraftModel = oboRequire('server/models/draft')
const logger = oboRequire('server/logger')
const pgp = require('pg-promise')
const xmlToDraftObject = require('obojobo-document-xml-parser/xml-to-draft-object')
const emptyXmlPath = require.resolve('obojobo-document-engine/documents/empty.xml')
const draftTemplateXML = fs.readFileSync(emptyXmlPath).toString()
const tutorialDraft = require('obojobo-document-engine/src/scripts/oboeditor/documents/oboeditor-tutorial.json')
const draftTemplate = xmlToDraftObject(draftTemplateXML, true)
const DraftPermissions = require('obojobo-repository/server/models/draft_permissions')
const {
	checkValidationRules,
	requireDraftId,
	requireCanViewEditor,
	requireCanCreateDrafts,
	requireCanDeleteDrafts,
	checkContentId
} = oboRequire('server/express_validators')

const isNoDataFromQueryError = e => {
	return (
		e instanceof pgp.errors.QueryResultError && e.code === pgp.errors.queryResultErrorCode.noData
	)
}

// Get a complete Draft Document Tree (for editing)
// optional query variable: contentId=<draftContentId>
// mounted as /api/drafts/:draftId/full
router
	.route('/:draftId/full')
	.get([requireDraftId, requireCanViewEditor, checkContentId, checkValidationRules])
	.get(async (req, res) => {
		try {
			// @TODO: checking permissions should probably be more dynamic, not hard-coded to the repository
			const hasPerms = await DraftPermissions.userHasPermissionToDraft(
				req.currentUser.id,
				req.params.draftId
			)

			if (!hasPerms) {
				return res.notAuthorized(
					'You must be the author of this draft to retrieve this information'
				)
			}

			let draftModel
			if (req.query.contentId) {
				// a specific verion is requested
				draftModel = await DraftModel.fetchDraftByVersion(req.params.draftId, req.query.contentId)
			} else {
				// get the current version
				draftModel = await DraftModel.fetchById(req.params.draftId)
			}
			const draftDocument = draftModel.document
			res.format({
				'application/xml': async () => {
					let xml = await draftModel.xmlDocument
					if (!xml) {
						const jsonToXml = require('obojobo-document-json-parser/json-to-xml-parser')
						xml = jsonToXml(draftDocument)
					}
					res.set('Obo-DraftContentId', draftDocument.contentId)
					res.send(xml)
				},
				default: () => {
					res.set('Obo-DraftContentId', draftDocument.contentId)
					res.success(draftDocument)
				}
			})
		} catch (e) {
			if (isNoDataFromQueryError(e)) {
				return res.missing('Draft not found')
			}

			res.unexpected(e)
		}
	})

// Get a Draft Document Tree (for viewing by a student)
// mounted as /api/drafts/:draftId
router
	.route('/:draftId')
	.get([requireDraftId, checkValidationRules])
	.get(async (req, res) => {
		try {
			const draftModel = await DraftModel.fetchById(req.params.draftId)

			// Dispatch the "internal:sendToClient" event - this allows any installed OboNode to
			// alter the data before the document is returned (for example, to remove assessment
			// questions)
			draftModel.root.yell('internal:sendToClient', req, res)

			return res.success(draftModel.document)
		} catch (e) {
			if (isNoDataFromQueryError(e)) {
				return res.missing('Draft not found')
			}

			res.unexpected(e)
		}
	})

// Create a Draft
// mounted as /api/drafts/new
router
	.route('/new')
	.post(requireCanCreateDrafts)
	.post(async (req, res, next) => {
		if (req.body.collectionId) {
			const hasPermsToCollection = await DraftPermissions.userHasPermissionToCollection(
				req.currentUser.id,
				req.body.collectionId
			)
			if (!hasPermsToCollection) {
				return res.notAuthorized(
					'You must have permissions to the requested collection to add a new module to it.'
				)
			}
		}

		const content = req.body.moduleContent ? req.body.moduleContent.content : null
		const format = req.body.moduleContent ? req.body.moduleContent.format : null

		let draftJson = !format ? draftTemplate : null
		let draftXml = !format ? draftTemplateXML : null

		if (format === 'application/json') {
			draftJson = content
		} else if (format === 'application/xml') {
			draftXml = content
			try {
				const convertedXml = xmlToDraftObject(draftXml, true)
				if (convertedXml) {
					draftJson = convertedXml
				} else {
					logger.error('Parse XML non-error?', convertedXml)
					return res.unexpected()
				}
			} catch (e) {
				logger.error('Parse XML Failed:', e, content)
				return res.unexpected(e)
			}
		}

		try {
			const newDraft = await DraftModel.createWithContent(req.currentUser.id, draftJson, draftXml)
			if (req.body.collectionId) {
				await CollectionModel.addModule(req.body.collectionId, newDraft.id, req.currentUser.id)
			}
			res.set('Obo-DraftContentId', newDraft.content.id)
			res.success({
				id: newDraft.id,
				contentId: newDraft.content.id,
				collectionId: req.body.collectionId
			})
		} catch (error) {
			res.unexpected(error)
		}
	})

// Create an editable tutorial document
// mounted as /api/drafts/tutorial
router
	.route('/tutorial')
	.post(requireCanCreateDrafts)
	.post(async (req, res) => {
		try {
			if (req.body.collectionId) {
				const hasPermsToCollection = await DraftPermissions.userHasPermissionToCollection(
					req.currentUser.id,
					req.body.collectionId
				)
				if (!hasPermsToCollection) {
					return res.notAuthorized(
						'You must have permissions to the requested collection to add a new module to it.'
					)
				}
			}
			const newDraft = await DraftModel.createWithContent(req.currentUser.id, tutorialDraft)
			if (req.body.collectionId) {
				await CollectionModel.addModule(req.body.collectionId, newDraft.id, req.currentUser.id)
			}
			res.set('Obo-DraftContentId', newDraft.content.id)
			res.success({
				id: newDraft.id,
				contentId: newDraft.content.id,
				collectionId: req.body.collectionId
			})
		} catch (error) {
			res.unexpected(error)
		}
	})

// Update a Draft
// mounted as /api/drafts/:draftid
router
	.route('/:draftId')
	.post([requireCanCreateDrafts, requireDraftId, checkValidationRules])
	.post((req, res) => {
		return Promise.resolve()
			.then(() => {
				let xml
				let documentInput

				if (typeof req.body === 'string') {
					// req.body expected to be xml document
					try {
						xml = req.body
						const convertedXml = xmlToDraftObject(req.body, true)
						if (convertedXml && typeof convertedXml === 'object') {
							documentInput = convertedXml
						} else {
							logger.error('Parse XML non-error?', convertedXml)
						}
					} catch (e) {
						logger.error('Parse XML Failed:', e, req.body)
					}
				} else {
					// req.body expected to by json document
					documentInput = req.body
				}

				if (!documentInput || typeof documentInput !== 'object') {
					const msg = 'Posting draft failed - format unexpected'
					logger.error(msg, req.body)
					res.badInput(msg)
					return
				}

				// Scan through json for identical ids
				const duplicateId = DraftModel.findDuplicateIds(documentInput)

				if (duplicateId !== null) {
					const msg = `Posting draft failed - duplicate id "${duplicateId}"`
					logger.error(msg)
					res.badInput(msg)
					return
				}

				return DraftModel.updateContent(
					req.params.draftId,
					req.currentUser.id,
					documentInput,
					xml || null
				).then(id => {
					res.set('Obo-DraftContentId', id)
					res.success({ id })
				})
			})
			.catch(res.unexpected)
	})

// Delete a Draft
// mounted as /api/drafts/:draftId
router
	.route('/:draftId')
	.delete([requireCanDeleteDrafts, requireDraftId, checkValidationRules])
	.delete(async (req, res) => {
		const hasPerms = await DraftPermissions.userHasPermissionToDraft(
			req.currentUser.id,
			req.params.draftId
		)

		if (!hasPerms) {
			return res.notAuthorized('You must be the author of this draft to delete it')
		}

		return DraftModel.deleteByIdAndUser(req.params.draftId, req.currentUser.id)
			.then(res.success)
			.catch(res.unexpected)
	})

module.exports = router
