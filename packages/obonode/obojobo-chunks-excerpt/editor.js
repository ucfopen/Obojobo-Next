// Main entrypoint for editor
import Common from 'obojobo-document-engine/src/scripts/common'
import EditorNode from './editor-registration'

// register
Common.Registry.registerEditorModel(EditorNode)
