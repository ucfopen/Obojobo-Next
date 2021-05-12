import React, { useState } from 'react'

import iconFontSizeSmall from '../icon-font-size-small.svg'
import iconFontSizeMedium from '../icon-font-size-medium.svg'
import iconFontSizeLarge from '../icon-font-size-large.svg'
import iconLineHeightCompact from '../icon-line-height-compact.svg'
import iconLineHeightModerate from '../icon-line-height-moderate.svg'
import iconLineHeightGenerous from '../icon-line-height-generous.svg'
import iconWidthLarge from '../icon-width-large.svg'
import iconWidthMedium from '../icon-width-medium.svg'
import iconWidthSmall from '../icon-width-small.svg'
import iconWidthTiny from '../icon-width-tiny.svg'
import Button from 'obojobo-document-engine/src/scripts/common/components/button'
import RadioIcons from './radio-icons'

const NO_EFFECT_DESCRIPTION = '(No effect available)'

const presets = [
	{
		label: 'Minimal',
		value: 'minimal'
	},
	{
		label: 'Excerpt',
		value: 'excerpt'
	},
	{
		label: 'Simple Filled',
		value: 'simple-filled'
	},
	{
		label: 'Simple Bordered',
		value: 'simple-bordered'
	},
	{
		label: 'Card',
		value: 'card'
	},
	{
		label: 'Fiction',
		value: 'fiction'
	},
	{
		label: 'Non-Fiction',
		value: 'non-fiction'
	},
	{
		label: 'Historical',
		value: 'historical'
	},
	{
		label: 'Very Historical',
		value: 'very-historical'
	},
	{
		label: 'White Paper',
		value: 'white-paper'
	},
	{
		label: 'Inst. Manual',
		value: 'instruction-manual'
	},
	{
		label: 'Typewritten',
		value: 'typewritten'
	},
	{
		label: 'Receipt',
		value: 'receipt'
	},
	{
		label: 'Site / Doc',
		value: 'modern-text-file'
	},
	{
		label: 'Retro Text File',
		value: 'retro-text-file'
	},
	{
		label: 'Command Line',
		value: 'computer-modern'
	},
	{
		label: 'Hacker Green',
		value: 'computer-hacker-green'
	},
	{
		label: 'Hacker Orange',
		value: 'computer-hacker-orange'
	}
]

const isEffectAvailable = bodyStyle => {
	return getEffectDescription(bodyStyle) !== NO_EFFECT_DESCRIPTION
}

const getEffectDescription = bodyStyle => {
	switch (bodyStyle) {
		case 'white-paper':
		case 'modern-paper':
		case 'light-yellow-paper':
		case 'dark-yellow-paper':
		case 'aged-paper':
			return 'Paper background'

		case 'term-white':
		case 'term-orange':
		case 'term-green':
			return 'Screen / glow effects'

		case 'modern-text-file':
		case 'retro-text-file':
			return 'Drop shadow'

		default:
			return NO_EFFECT_DESCRIPTION
	}
}

const ExcerptEditControls = ({ content, onChangeProp, onChangePreset }) => {
	const [isShowingMoreOptions, setIsShowingMoreOptions] = useState(false)

	return (
		<div
			contentEditable={false}
			className="attributes-box"
			onMouseDown={event => {
				switch (event.target.tagName) {
					case 'INPUT':
					case 'SELECT':
						return

					default:
						event.preventDefault()
				}
			}}
		>
			<div className="attributes-list">
				<div>
					{isShowingMoreOptions ? null : (
						<ul className="preset-list">
							{presets.map(p => {
								return (
									<li
										key={p.value}
										className={content.preset === p.value ? 'is-selected' : 'is-not-selected'}
									>
										<button onClick={() => onChangePreset(p.value)}>
											<div className={`icon icon-${p.value}`}></div>
											<span>{p.label}</span>
										</button>
									</li>
								)
							})}
						</ul>
					)}
				</div>

				{isShowingMoreOptions ? (
					<div className="more-options">
						<div>
							<label className="attribute-label">
								<span>Style</span>
							</label>
							<select
								value={content.bodyStyle}
								onChange={event => onChangeProp('bodyStyle', event.target.value)}
							>
								<optgroup label="Simple">
									<option value="none">None</option>
									<option value="filled-box">Filled Box</option>
									<option value="bordered-box">Bordered Box</option>
									<option value="card">Card</option>
								</optgroup>
								<optgroup label="Paper">
									<option value="white-paper">White Paper</option>
									<option value="modern-paper">Gray Paper</option>
									<option value="light-yellow-paper">Light Yellow Paper</option>
									<option value="dark-yellow-paper">Dark Yellow Paper</option>
									<option value="aged-paper">Aged Paper</option>
								</optgroup>
								<optgroup label="Computer">
									<option value="modern-text-file">Browser</option>
									<option value="retro-text-file">Retro Text File</option>
									<option value="command-line">Command Line</option>
									<option value="term-white">CRT Terminal (White)</option>
									<option value="term-green">CRT Terminal (Green)</option>
									<option value="term-orange">CRT Terminal (Orange)</option>
									<option value="term-c64">Commodore 64 Screen</option>
								</optgroup>
							</select>
						</div>

						<div>
							<label className="attribute-label">
								<span>Font</span>
							</label>
							<select
								value={content.font}
								onChange={event => onChangeProp('font', event.target.value)}
							>
								<optgroup label="Obojobo Default Fonts">
									<option value="serif">Serif</option>
									<option value="sans">Sans-Serif</option>
									<option value="monospace">Monospace</option>
								</optgroup>
								<optgroup label="System Fonts">
									<option value="times-new-roman">Times New Roman</option>
									<option value="georgia">Georgia</option>
									<option value="helvetica">Helvetica</option>
									<option value="courier">Courier</option>
									<option value="palatino">Palatino</option>
								</optgroup>
							</select>
						</div>

						<div>
							<label className="attribute-label">
								<span>Width</span>
							</label>
							<RadioIcons
								name="width"
								ariaLabel="blah"
								options={[
									{ label: 'large', icon: <img src={iconWidthLarge} /> },
									{ label: 'medium', icon: <img src={iconWidthMedium} /> },
									{ label: 'small', icon: <img src={iconWidthSmall} /> },
									{ label: 'tiny', icon: <img src={iconWidthTiny} /> }
								]}
								selectedOption={content.width}
								onChangeOption={value => onChangeProp('width', value)}
							/>
						</div>

						<div>
							<label className="attribute-label">
								<span>Font Size</span>
							</label>
							<RadioIcons
								name="font-size"
								ariaLabel="blah"
								options={[
									{ label: 'smaller', icon: <img src={iconFontSizeSmall} /> },
									{ label: 'regular', icon: <img src={iconFontSizeMedium} /> },
									{ label: 'larger', icon: <img src={iconFontSizeLarge} /> }
								]}
								selectedOption={content.fontSize}
								onChangeOption={value => onChangeProp('fontSize', value)}
							/>
						</div>
						<div>
							<label className="attribute-label">
								<span>Line Height</span>
							</label>
							<RadioIcons
								name="line-height"
								ariaLabel="blah"
								options={[
									{ label: 'compact', icon: <img src={iconLineHeightCompact} /> },
									{ label: 'moderate', icon: <img src={iconLineHeightModerate} /> },
									{ label: 'generous', icon: <img src={iconLineHeightGenerous} /> }
								]}
								selectedOption={content.lineHeight}
								onChangeOption={value => onChangeProp('lineHeight', value)}
							/>
						</div>
						<div>
							<label
								className={`effect-settings ${isEffectAvailable ? 'is-enabled' : 'is-not-enabled'}`}
							>
								<input
									disabled={!isEffectAvailable}
									type="checkbox"
									checked={content.effect}
									onChange={event => {
										onChangeProp('effect', event.target.checked)
									}}
								/>
								<span>{getEffectDescription(content.bodyStyle)}</span>
							</label>
						</div>
					</div>
				) : null}
			</div>
			<Button
				altAction
				onClick={() => {
					setIsShowingMoreOptions(!isShowingMoreOptions)
				}}
			>
				{isShowingMoreOptions ? 'Exit advanced options' : 'Advanced options...'}
			</Button>
		</div>
	)
}

export default ExcerptEditControls
