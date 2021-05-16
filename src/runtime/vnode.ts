export interface VNode {
	type: string | any,
	props: object,
	el?: HTMLElement,
	shapeFlag: 'element' | 'component',
	children: VNode[]
}

export function createVNode(type, props, children){
	return {
		type,
		props,
		shapeFlag: typeof type === 'string' ? 'element' : 'component',
		el: null,
		children
	}
}

export const h = createVNode
