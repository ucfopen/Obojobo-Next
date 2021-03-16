require('./collection-image.scss')

const React = require('react')

const CollectionImage = props => (
	<div className="repository--collection-icon--image">
		<svg
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMid meet"
			viewBox="0 0 80 80"
			width="80"
			height="80"
		>
			<defs>
				<pattern
					id={`collection-img-id-${props.id}`}
					patternUnits="userSpaceOnUse"
					width="150"
					height="150"
					dangerouslySetInnerHTML={{
						__html: `<image xlink:href="/library/module-icon/${props.id}" width="150" height="150" />`
					}}
				/>
			</defs>
			<rect rx="5" height="80" width="80" fill="#e8e3eb" />
			<path
				d="m20.092289,37.657358q2.2001,-1.270228 4.400197,0l12.100543,6.986251q2.200097,1.270228 2.200097,3.810684l0,13.972502q0,2.540453 -2.200097,3.810681l-12.100543,6.986251q-2.200097,1.270228 -4.400197,0l-12.100543,-6.986251q-2.200097,-1.270228 -2.200097,-3.810681l0,-13.972502q0,-2.540456 2.200097,-3.810684l12.100543,-6.986251z"
				className="repository--collection-icon--pattern-path"
				fill={`url(#collection-img-id-${props.id})`}
			/>
			<path
				d="m55.507514,37.65736q2.200094,-1.270229 4.400197,0l12.100545,6.986249q2.200094,1.270229 2.200094,3.81068l0,13.972507q0,2.54045 -2.200094,3.81068l-12.100545,6.986249q-2.200103,1.270229 -4.400197,0l-12.100545,-6.986249q-2.200094,-1.270229 -2.200094,-3.81068l0,-13.972507q0,-2.54045 2.200094,-3.81068l12.100545,-6.986249z"
				fill="#9482a6"
			/>
			<path
				d="m37.861174,6.776266q2.200094,-1.270229 4.400197,0l12.100545,6.986249q2.200094,1.270229 2.200094,3.81068l0,13.972507q0,2.54045 -2.200094,3.81068l-12.100545,6.986249q-2.200103,1.270229 -4.400197,0l-12.100545,-6.986249q-2.200094,-1.270229 -2.200094,-3.81068l0,-13.972507q0,-2.54045 2.200094,-3.81068l12.100545,-6.986249z"
				fill="#b09ec3"
			/>
		</svg>
	</div>
)

module.exports = CollectionImage
