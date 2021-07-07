import React from 'react'
import './switch.scss'

/* istanbul ignore next */
const noOp = () => {}

const SwitchCore = ({ checked = false, onChange = noOp, title, description, forwardedRef }) => (
	<div className="obojobo-draft--components--switch">
		<div className="text-content">
			{title ? <span contentEditable={false}>{title}</span> : null}
			<br />
			<small>{description && description}</small>
		</div>
		<label className="switch">
			<input
				className="switch-slider"
				type="checkbox"
				checked={checked}
				onChange={onChange}
				ref={forwardedRef}
			/>
			<div className="switch-slider round" />
		</label>
	</div>
)

// Add ability to forward refs for the purpose of focusing inputs
const Switch = React.forwardRef((props, ref) => <SwitchCore {...props} forwardedRef={ref} />)
export default Switch
