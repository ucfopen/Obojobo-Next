import './edit-iframe-modal.scss'

import React from 'react'
import Common from 'Common'

const { Switch } = Common.components
const { SimpleDialog } = Common.components.modal
import IFrameSizingTypes from './iframe-sizing-types'
import IFrameContentTypes from './iframe-content-types'

class EditIframeModal extends React.Component {
	constructor(props) {
		super(props)

		const defaultState = {
			contentType: IFrameContentTypes.MEDIA,
			autoload: false,
			border: false,
			fit: '',
			initialZoom: 1,
			src: '',
			srcToLoad: '',
			title: '',
			width: 640,
			height: 480,
			controls: '',
			sizing: IFrameSizingTypes.TEXT_WIDTH,
			openAdvancedOptions: false,
			openSizingDimensions: false
		}

		this.state = {
			...defaultState,
			...props.content,
			sizingMaxWidthStyle: {},
			sizingTextWidthStyle: {},
			sizingFixedWidthStyle: {}
		}

		this.changeBtnRef = React.createRef()

		this.handleFitChange = this.handleFitChange.bind(this)
		this.handleZoomChange = this.handleZoomChange.bind(this)
		this.onChangeAutoload = this.onChangeAutoload.bind(this)
		this.handleWidthChange = this.handleWidthChange.bind(this)
		this.handleTitleChange = this.handleTitleChange.bind(this)
		this.handleHeightChange = this.handleHeightChange.bind(this)
		this.handleSizingChange = this.handleSizingChange.bind(this)
		this.handleBorderChange = this.handleBorderChange.bind(this)
		this.handleSourceChange = this.handleSourceChange.bind(this)
		this.openAdvancedOptions = this.openAdvancedOptions.bind(this)
		this.openSizingDimensions = this.openSizingDimensions.bind(this)
		this.handleSizingClickStyle = this.handleSizingClickStyle.bind(this)
		this.handleContentTypeChange = this.handleContentTypeChange.bind(this)
		this.updateSettingsBasedOnContentType = this.updateSettingsBasedOnContentType.bind(this)
	}

	componentDidMount() {
		this.changeBtnRef.current.focus()
		this.updateSettingsBasedOnContentType(this.state.contentType)

		// Setting styles of selected inputs based on props from new-iframe-modal
		this.handleSizingClickStyle(this.state.sizing)
	}

	openAdvancedOptions() {
		this.setState({ openAdvancedOptions: !this.state.openAdvancedOptions })
	}

	openSizingDimensions() {
		this.setState({ openSizingDimensions: !this.state.openSizingDimensions })
	}

	handleSizingClickStyle(sizing) {
		// color-action: #6714bd;
		this.setState({
			sizingMaxWidthStyle:
				sizing === IFrameSizingTypes.MAX_WIDTH
					? { backgroundColor: '#e5d9e3', color: '#6714bd' }
					: {},
			sizingTextWidthStyle:
				sizing === IFrameSizingTypes.TEXT_WIDTH
					? { backgroundColor: '#e5d9e3', color: '#6714bd' }
					: {},
			sizingFixedWidthStyle:
				sizing === IFrameSizingTypes.FIXED ? { backgroundColor: '#e5d9e3', color: '#6714bd' } : {}
		})
	}

	updateSettingsBasedOnContentType(contentType) {
		// Default configuration based on content type selection
		if (contentType === IFrameContentTypes.MEDIA) {
			this.setState({ fit: 'scale', controls: ',reload' })
		} else {
			this.setState({ fit: 'scroll', controls: ',reload,new-window,zoom' })
		}
	}

	handleControlChange(property, event) {
		const controls = new Set(this.state.controls.split(','))

		// Use checked value to determine the control string for the changed property
		// Use controlList values to determine control strings for unchanged properties
		if (event.target.checked) {
			controls.add(property)
		} else {
			controls.delete(property)
		}

		this.setState({ controls: [...controls].join(',') })
	}

	onChangeAutoload(event) {
		this.setState({ autoload: event.target.value === 'true' })
	}

	handleFitChange(e) {
		this.setState({ fit: e.target.value })
	}

	handleZoomChange(e) {
		this.setState({ initialZoom: e.target.value })
	}

	handleSizingChange(e) {
		this.setState({ sizing: e.target.value })
	}

	handleTitleChange(e) {
		this.setState({ title: e.target.value })
	}

	handleBorderChange(e) {
		this.setState({ border: e.target.checked })
	}

	handleWidthChange(e) {
		this.setState({ width: e.target.value })
	}

	handleHeightChange(e) {
		this.setState({ height: e.target.value })
	}

	handleContentTypeChange(e) {
		const contentType = e.target.value
		this.setState({ contentType })
		this.updateSettingsBasedOnContentType(contentType)
	}

	handleSourceChange(e) {
		this.props.onCancel()
		this.props.goBack(e, this.state.src)
	}

	render() {
		const controlList = this.state.controls ? this.state.controls.split(',') : []

		const isSizingSetToTextOrMaxWidth =
			this.state.sizing === IFrameSizingTypes.TEXT_WIDTH ||
			this.state.sizing === IFrameSizingTypes.MAX_WIDTH

		return (
			<SimpleDialog
				cancelOk
				title="Edit Embedded IFrame"
				onConfirm={() => this.props.onConfirm(this.state)}
				onCancel={this.props.onCancel}
			>
				<div className="edit-iframe-modal">
					<header>
						<label htmlFor="src-input">Source:</label>
						<div>
							<input id="src-input" disabled value={this.state.src} />
							<button ref={this.changeBtnRef} onClick={this.handleSourceChange}>
								Change...
							</button>
						</div>
					</header>
					<div className="content-type">
						<div className="content-type-options-container">
							<label id="content-type-options-label" htmlFor="content-type-options">
								Content type:
							</label>
							<div id="content-type-options">
								<label htmlFor="video-or-media">
									<input
										id="video-or-media"
										type="radio"
										name="content-type-option"
										value={IFrameContentTypes.MEDIA}
										checked={this.state.contentType === IFrameContentTypes.MEDIA}
										onChange={this.handleContentTypeChange}
									/>
									<div>
										<div className="video-or-media-icon"></div>
										<span>Video or other media</span>
									</div>
								</label>
								<label htmlFor="embedded-webpage">
									<input
										id="embedded-webpage"
										type="radio"
										name="content-type-option"
										value={IFrameContentTypes.WEBPAGE}
										checked={this.state.contentType === IFrameContentTypes.WEBPAGE}
										onChange={this.handleContentTypeChange}
									/>
									<div>
										<div className="embedded-webpage-icon"></div>
										<span>Embedded webpage</span>
									</div>
								</label>
							</div>
						</div>
						<small>This helps determine how the embedded content is best displayed</small>
					</div>
					<p className="title">Options</p>
					<div className="sizing">
						<label htmlFor="sizing-options-container">Sizing</label>
						<div id="sizing-options-container">
							<div className="sizing-options">
								<label
									style={this.state.sizingMaxWidthStyle}
									htmlFor="max-width"
									onClick={() => this.handleSizingClickStyle(IFrameSizingTypes.MAX_WIDTH)}
								>
									<input
										id="max-width"
										type="radio"
										name="sizing-option"
										value={IFrameSizingTypes.MAX_WIDTH}
										checked={this.state.sizing === IFrameSizingTypes.MAX_WIDTH}
										onChange={this.handleSizingChange}
									/>
									<div className="icon max-width-icon"></div>
									<div className="sizing-description">
										<p className="sizing-title">Responsive - full width</p>
										<p>Grows up to the largest size (wider thant text)</p>
									</div>
								</label>
								<label
									style={this.state.sizingTextWidthStyle}
									htmlFor="text-width"
									onClick={() => this.handleSizingClickStyle(IFrameSizingTypes.TEXT_WIDTH)}
								>
									<input
										id="text-width"
										type="radio"
										name="sizing-option"
										value={IFrameSizingTypes.TEXT_WIDTH}
										checked={this.state.sizing === IFrameSizingTypes.TEXT_WIDTH}
										onChange={this.handleSizingChange}
									/>
									<div className="icon text-width-icon"></div>
									<div className="sizing-description">
										<p className="sizing-title">Responsive - text width</p>
										<p>Grows up to the same width as the text</p>
									</div>
								</label>
								<label
									style={this.state.sizingFixedWidthStyle}
									htmlFor="fixed-width"
									onClick={() => this.handleSizingClickStyle(IFrameSizingTypes.FIXED)}
								>
									<input
										id="fixed-width"
										type="radio"
										name="sizing-option"
										value={IFrameSizingTypes.FIXED}
										checked={this.state.sizing === IFrameSizingTypes.FIXED}
										onChange={this.handleSizingChange}
									/>
									<div className="icon fixed-width-icon"></div>
									<div className="sizing-description">
										<p className="sizing-title">Fixed size</p>
										<p>Shows at set pixel dimensions</p>
									</div>
								</label>
							</div>
							<button onClick={this.openSizingDimensions}>
								{this.state.openSizingDimensions ? (
									<span>Close dimensions</span>
								) : (
									<span>Edit dimensions</span>
								)}
							</button>
						</div>
					</div>
					{this.state.openSizingDimensions && (
						<div className="dimensions-container">
							<div className="left-padding"></div>
							<div className="dimensions">
								<input
									type="number"
									min="1"
									max="20000"
									step="1"
									placeholder={isSizingSetToTextOrMaxWidth ? '--' : 'Width'}
									aria-label="Width"
									value={isSizingSetToTextOrMaxWidth ? '' : this.state.width}
									onChange={this.handleWidthChange}
									disabled={isSizingSetToTextOrMaxWidth}
								/>
								<span className="pixels">
									px <span className="lighter">×</span>
								</span>
								<input
									type="number"
									min="1"
									max="20000"
									step="1"
									placeholder="Height"
									aria-label="Height"
									value={this.state.height}
									onChange={this.handleHeightChange}
								/>
								<span className="pixels">px</span>
							</div>
						</div>
					)}
					<div className="loading-container">
						<label htmlFor="loading-select">Loading:</label>
						<div id="loading-select">
							<select value={this.state.autoload || false} onChange={this.onChangeAutoload}>
								<option value={false}>Load when student clicks IFrame</option>
								<option value={true}>Load right away (Not recommended)</option>
							</select>
							{this.state.autoload && (
								<small>
									<div className="warning-icon"></div>
									This option might cause your module to load or run slowly
								</small>
							)}
						</div>
					</div>
					<div className="title-container">
						<label htmlFor="title-input">Title:</label>
						<div id="title-input">
							<input
								type="text"
								placeholder="E.g.: The difference between speed and velocity"
								value={this.state.title}
								onChange={this.handleTitleChange}
							/>
							<small>This will be shown before the IFrame is loaded</small>
						</div>
					</div>
					<div className="advanced-options-container">
						<button className="button-advanced-options" onClick={this.openAdvancedOptions}>
							{this.state.openAdvancedOptions ? (
								<span>Close advanced options</span>
							) : (
								<span>Show all options (advanced)</span>
							)}
						</button>
						{this.state.openAdvancedOptions && (
							<div className="advanced-options">
								<div className="fit-container">
									<label htmlFor="select-fit">Fit:</label>
									<select
										id="select-fit"
										value={this.state.fit || 'scale'}
										onChange={this.handleFitChange}
									>
										<option value="scale">Scale</option>
										<option value="scroll">Scroll</option>
									</select>
								</div>
								<div className="initial-zoom-container">
									<label htmlFor="initial-zoom">
										Initial <br /> Zoom:
									</label>
									<input
										id="initial-zoom"
										min="0.01"
										max="1000"
										step=".01"
										type="number"
										placeholder="Decimal Value"
										value={this.state.initialZoom}
										onChange={this.handleZoomChange}
									/>
								</div>
								<p className="title">Controls</p>
								<div className="controls">
									<div className="border-container">
										<Switch
											title="Border"
											description="Adds a border around your embedded IFrame"
											checked={this.state.border}
											onChange={this.handleBorderChange}
										/>
									</div>
									<div className="reload-container">
										<Switch
											title="Reload"
											description="Adds a control option to reload the contents of the IFrame"
											checked={controlList.includes('reload')}
											onChange={this.handleControlChange.bind(this, 'reload')}
										/>
									</div>
									<div className="new-window-container">
										<Switch
											title="New Window"
											description="Allows the IFrame to be opened in a new window"
											checked={controlList.includes('new-window')}
											onChange={this.handleControlChange.bind(this, 'new-window')}
										/>
									</div>
									<div className="zoom-container">
										<Switch
											title="Zoom"
											description="Allows students to zoom in and out on the IFrame contents"
											checked={controlList.includes('zoom')}
											onChange={this.handleControlChange.bind(this, 'zoom')}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</SimpleDialog>
		)
	}
}

export default EditIframeModal
