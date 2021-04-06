// searching for the viewer scripts is expensive, this will cache them
if (!global.__viewerScriptCache) {
	const { gatherClientScriptsFromModules } = require('obojobo-lib-utils')
	const entriesFromObojoboModules = gatherClientScriptsFromModules()
	const chunkViewerScripts = entriesFromObojoboModules.viewer.filter(
		item => !item.includes('obojobo-document-engine')
	)
	// skip viewer scripts from the doc-engine
	global.__viewerScriptCache = chunkViewerScripts.filter(
		script => !script.includes('obojobo-document-engine')
	)
}

global.__viewerScriptCache.forEach(script => require(script))
