import React from 'react'
import Common from 'Common'

const { SimpleDialog } = Common.components.modal
const { Switch } = Common.components
import IFrameSizingTypes from './iframe-sizing-types'

import './iframe-properties-modal.scss'

class IFrameProperties extends React.Component {
	constructor(props) {
		super(props)
		const defaultState = {
			autoload: false,
			border: false,
			fit: '',
			height: 480,
			initialZoom: 1,
			src: '',
			title: '',
			width: 640,
			controls: '',
			sizing: IFrameSizingTypes.FIXED
		}
		this.state = { ...defaultState, ...props.content }
		this.inputRef = React.createRef()

		this.focusOnFirstElement = this.focusOnFirstElement.bind(this)
		this.handleTitleChange = this.handleTitleChange.bind(this)
		this.handleURLChange = this.handleURLChange.bind(this)
		this.handleWidthChange = this.handleWidthChange.bind(this)
		this.handleHeightChange = this.handleHeightChange.bind(this)
		this.handleBorderChange = this.handleBorderChange.bind(this)
		this.handleAutoloadChange = this.handleAutoloadChange.bind(this)
		this.handleFitChange = this.handleFitChange.bind(this)
		this.handleZoomChange = this.handleZoomChange.bind(this)
		this.handleSizingChange = this.handleSizingChange.bind(this)
	}

	componentDidMount() {
		this.inputRef.current.focus()
		this.inputRef.current.select()
	}

	handleTitleChange(event) {
		const title = event.target.value

		this.setState({ title })
	}

	handleURLChange(event) {
		const src = event.target.value

		this.setState({ src })
	}

	handleBorderChange(event) {
		this.setState({ border: event.target.checked })
	}

	handleFitChange(event) {
		const fit = event.target.value

		this.setState({ fit })
	}

	handleWidthChange(event) {
		const width = event.target.value

		this.setState({ width })
	}

	handleHeightChange(event) {
		const height = event.target.value

		this.setState({ height })
	}

	handleZoomChange(event) {
		const initialZoom = event.target.value

		this.setState({ initialZoom })
	}

	handleSizingChange(event) {
		const sizing = event.target.value

		this.setState({ sizing })
	}

	handleAutoloadChange(event) {
		this.setState({ autoload: event.target.checked })
	}

	handleControlChange(property, event) {
		const controls = new Set(this.state.controls.split(',').filter(control => control !== ''))

		// Use checked value to determine the control string for the changed property
		// Use controlList values to determine control strings for unchanged properties
		if (event.target.checked) {
			controls.add(property)
		} else {
			controls.delete(property)
		}

		this.setState({ controls: [...controls].join(',') })
	}

	focusOnFirstElement() {
		this.inputRef.current.focus()
	}

	render() {
		const controlList = this.state.controls ? this.state.controls.split(',') : []

		const isSizingSetToTextOrMaxWidth =
			this.state.sizing === IFrameSizingTypes.TEXT_WIDTH ||
			this.state.sizing === IFrameSizingTypes.MAX_WIDTH

		return (
			<SimpleDialog
				cancelOk
				title="IFrame Properties"
				onConfirm={() => this.props.onConfirm(this.state)}
				onCancel={this.props.onCancel}
				focusOnFirstElement={this.focusOnFirstElement}
				modalClassName="iframe-properties-simple-dialog"
			>
				<div className={'iframe-properties'}>
					<div className="info">
						<div>
							<label htmlFor="obojobo-draft--chunks--iframe--properties-modal--title">Title:</label>
							<input
								type="text"
								id="obojobo-draft--chunks--iframe--properties-modal--title"
								ref={this.inputRef}
								value={this.state.title || ''}
								placeholder="IFrame Title"
								onChange={this.handleTitleChange}
							/>
						</div>

						<div className="source-option-container">
							<label htmlFor="obojobo-draft--chunks--iframe--properties-modal--src">Source:</label>
							<input
								type="text"
								id="obojobo-draft--chunks--iframe--properties-modal--src"
								value={this.state.src || ''}
								placeholder="Web Address"
								onChange={this.handleURLChange}
							/>
						</div>
					</div>

					<div className="options">
						<h2>Options:</h2>
						<div className="sizing-option-container">
							<label htmlFor="obojobo-draft--chunks--iframe--properties-model--sizing">
								Sizing:
							</label>
							<select
								id="obojobo-draft--chunks--iframe--properties-model--sizing"
								value={this.state.sizing}
								onChange={this.handleSizingChange}
							>
								<option value="fixed">Fixed</option>
								<option value="text-width">Text Width</option>
								<option value="max-width">Max Width</option>
							</select>
						</div>
						<div>
							<label>Dimensions:</label>
							<input
								id="obojobo-draft--chunks--iframe--properties-modal--custom-width"
								name="custom-width"
								min="1"
								max="20000"
								step="1"
								type="number"
								placeholder={isSizingSetToTextOrMaxWidth ? '--' : 'Width'}
								aria-label="Width"
								value={isSizingSetToTextOrMaxWidth ? '' : this.state.width}
								onChange={this.handleWidthChange}
								disabled={isSizingSetToTextOrMaxWidth}
							/>
							<span className="px-label">px ×</span>
							<input
								id="obojobo-draft--chunks--iframe--properties-modal--custom-height"
								min="1"
								max="200000"
								step="1"
								type="number"
								placeholder="Height"
								aria-label="Height"
								value={this.state.height}
								onChange={this.handleHeightChange}
							/>
							<span className="px-label">px</span>
						</div>
						<div className="border-option-container">
							<Switch
								title="Border"
								checked={this.state.border}
								onChange={this.handleBorderChange}
							/>
						</div>
						<div>
							<Switch
								title="Autoload"
								checked={this.state.autoload}
								onChange={this.handleAutoloadChange}
							/>
						</div>
						<div>
							<label htmlFor="obojobo-draft--chunks--iframe--properties-modal--fit">Fit:</label>
							<select
								id="obojobo-draft--chunks--iframe--properties-modal--fit"
								value={this.state.fit || 'scale'}
								onChange={this.handleFitChange}
							>
								<option value="scale">Scale</option>
								<option value="scroll">Scroll</option>
							</select>
						</div>
						<div className="zoom-option-container">
							<label htmlFor="obojobo-draft--chunks--iframe--properties-modal--zoom">
								Initial Zoom:
							</label>
							<input
								id="obojobo-draft--chunks--iframe--properties-modal--zoom"
								min="0.01"
								max="1000"
								step=".01"
								type="number"
								placeholder="Decimal Value"
								value={this.state.initialZoom}
								onChange={this.handleZoomChange}
							/>
						</div>
					</div>

					<div className="controls">
						<h2>Controls:</h2>
						<Switch
							title="Reload"
							checked={controlList.includes('reload')}
							onChange={this.handleControlChange.bind(this, 'reload')}
						/>
						<Switch
							title="New Window"
							checked={controlList.includes('new-window')}
							onChange={this.handleControlChange.bind(this, 'new-window')}
						/>
						<Switch
							title="Zoom"
							checked={controlList.includes('zoom')}
							onChange={this.handleControlChange.bind(this, 'zoom')}
						/>
					</div>
				</div>
			</SimpleDialog>
		)
	}
}

export default IFrameProperties
