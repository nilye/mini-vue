import { VNode } from "./vnode";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { emit } from "./componentEmit";

export function createComponentInstance(
	vnode: VNode
){

	const options = vnode.type

	const instance = {
		vnode,
		subTree: null,
		next: null,

		options: options,
		name: options.name,
		propsOptions: options.props,
		render: null,

		props: null,
		attrs: null,
		slots: null,
		emit: null,

		setup: vnode.type.setup,

		isMounted: false,
		mounted: null,
		unmounted: null,
		update: null
	}

	instance.emit = emit.bind(null, instance)

	return instance
}

export let currentInstance = null
export const getCurrentInstance = () => currentInstance

export function setupComponent(instance){
	const { props, children } = instance.vnode
	initProps(instance, props)
	initSlots(instance, children)

	const { setup } = instance.options
	if (setup){
		const setupContext = createSetupContext(instance)
		currentInstance = instance
		const setupResult = setup(setupContext)
		currentInstance = null

		if (typeof setupResult === 'function'){
			instance.render = setupResult
		} else {
			instance.setupState = setupResult
		}

	}
}

function createSetupContext(instance){
	return {
		attrs: instance.attrs,
		props: instance.props,
		slots: instance.slots,
		emit: instance.emit
	}
}
