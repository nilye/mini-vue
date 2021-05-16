export function initProps(
	instance,
	rawProps: any
){
	const props = {}
	const attrs = {}

	const propsOptions = instance.options.props
	if (rawProps){
		for (let key in rawProps){
			const value = rawProps[key]
			if ( propsOptions && (key in propsOptions || propsOptions.includes(key))){
				props[key] = value
			} else {
				attrs[key] = value
			}
		}

	}

	instance.props = props
	instance.attrs = attrs

}


export function updateProps(
	instance,
	newProps: any
){
	const propsOptions = instance.options.props
	if (newProps){
		for (let key in newProps){
			const value = newProps[key]
			if ( propsOptions && (key in propsOptions || propsOptions.includes(key))){
				if (instance.props[key] !== value){
					instance.props[key] = value
				}
			} else if (instance.attrs[key] !== value) {
				instance.attrs[key] = value
			}
		}
	}
}
