export function emit(
	instance,
	event: string,
	...args: any[]
){
	const props = instance.vnode.props
	let handlerName = 'on' + event[0].toUpperCase() + event.slice(1)
	let handler = props[handlerName]

	if (handler){
		handler(...args)
	}
}
