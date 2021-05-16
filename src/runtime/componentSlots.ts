import { VNode } from "./vnode";


export function initSlots(
	instance,
	children: VNode[]
){
	instance.slots = {}
	instance.slots.default = () => children
}
