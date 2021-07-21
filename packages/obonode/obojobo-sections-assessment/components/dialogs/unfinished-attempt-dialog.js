import React from 'react'
import Common from 'Common'
const { SimpleDialog } = Common.components.modal

const UnfinishedAttemptDialog = ({ onConfirm }) => (
	<SimpleDialog ok title="Resume Attempt" onConfirm={onConfirm}>
		<p>It looks like you were in the middle of an attempt. We&apos;ll resume where you left off.</p>
	</SimpleDialog>
)

export default UnfinishedAttemptDialog
