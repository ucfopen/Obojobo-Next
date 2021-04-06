import './materia-picker-dialog.scss'

import React, { useEffect, useMemo } from 'react'
import Dialog from 'obojobo-document-engine/src/scripts/common/components/modal/dialog'

const MateriaPickerDialogCore = ({
	onPick,
	onCancel,
	draftId,
	contentId,
	nodeId,
	forwardedRef
}) => {
	useEffect(() => {
		// listen for postmessage events
		window.addEventListener('message', onPick)

		// return cleanup function
		return () => {
			window.removeEventListener('message', onPick)
		}
	}, [])

	const buttons = useMemo(
		() => [
			{
				value: 'Cancel',
				altAction: true,
				onClick: onCancel
			}
		],
		[]
	)

	return (
		<Dialog buttons={buttons} title="Choose a Widget">
			<iframe
				ref={forwardedRef}
				id="materia-lti-picker"
				src={`/materia-lti-picker-launch?draftId=${draftId}&contentId=${contentId}&nodeId=${nodeId}`}
				frameBorder="0"
				loading="lazy"
			></iframe>
		</Dialog>
	)
}

// Add ability to forward refs for the purpose of focusing inputs
const MateriaPickerDialog = React.forwardRef((props, ref) => (
	<MateriaPickerDialogCore {...props} forwardedRef={ref} />
))
export default MateriaPickerDialog
