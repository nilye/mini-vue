import { createAppAPI } from "./createApp";
import { VNode } from "./vnode";
import { createComponentInstance, setupComponent } from "./component";
import { effect } from "../reactivity";
import { updateProps } from "./componentProps";

export function createRenderer(options){
	return baseCreateRenderer(options)
}

function baseCreateRenderer(options){

	const {
		insert,
		createElement,
		patchProp,
		setElementText,
		parentNode,
		remove
	} = options

	function patch(n1: VNode, n2: VNode, container){
		// not same type, unmount old tree
		if (n1 && n1.type !== n2.type){
			n1 = null
		}
		if (n2.shapeFlag === 'element') {
			processElement(n1, n2, container)
		} else if (n2.shapeFlag === 'component'){
			processComponent(n1, n2, container)
		}
	}

	function processElement(n1, n2, container){
		if (n1 == null) mountElement(n2, container)
		else patchElement(n1, n2)
	}

	function mountElement(vnode, container){
		let { type, props, children } = vnode
		let el = vnode.el = createElement(type)

		if (props){
			for (const key in props){
				patchProp(el, key, null, props[key])
			}
		}

		if (typeof children === 'string'){
			setElementText(el, children)
		} else {
			if (!Array.isArray(children)) children = [children]
			for (let n of children){
				patch(null, n, el)
			}
		}

		insert(el, container, null)
	}

	function patchElement(n1, n2){
		const el = n2.el = n1.el
		const oldProps = n1.props
		const newProps = n2.props

		for (const key in newProps){
			if (oldProps[key] !== newProps[key]){
				patchProp(el, key, oldProps[key], newProps[key])
			}
		}

		patchChildren(n1, n2, el)
	}

	function patchChildren(n1, n2, container){
		const c1 = n1 && n1.children
		const c2 = n2.children

		if (typeof c2 === 'string'){
			if (typeof c1 === 'string' && c1 !== c2){
				setElementText(container, c1)
			}
		} else {
			if (typeof c1 === 'string'){
				setElementText(container, '')
				c2.forEach(c => {
					mountElement(c, container)
				})
			} else {
				let l1 = c1.length, l2 = c2.length
				const commonLength = Math.min(l1, l2)
				for (let i = 0; i < commonLength; i++){
					patch(c1[i], c2[i], container)
				}
				if (l2 > l1) {
					c2.slice(l1).forEach(c => {
						patch(null, c, container)
					})
				} else if (l2 < l1){
					c1.slice(l2).forEach(c => {
						unmount(c)
					})
				}
			}
		}
	}

	function unmount(vnode){
		if (vnode.shapeFlag === 'element'){
			remove(vnode.el)
		} else if (vnode.shapeFlag === 'component'){
			unmountComponent(vnode.component)
		}
	}

	function processComponent(n1, n2, container){
		if (n1 == null) mountComponent(n2, container)
		else updateComponent(n1, n2)
	}

	function unmountComponent(instance){
		const { unmounted, subTree } = instance
		unmount(subTree)
		instance.isMounted = false
		if (unmounted) {
			unmounted()
		}
	}

	function mountComponent(vnode, container){
		const instance = vnode.component = createComponentInstance(vnode)
		setupComponent(instance)
		setupRenderEffect(instance, vnode, container)
	}

	function updateComponent(n1, n2){
		const instance = n2.component = n1.component
		instance.next = n2
		instance.update()
	}

	function setupRenderEffect(instance, vnode, container){
		instance.update = effect(function componentEffect(){
			if (!instance.isMounted){
				const { mounted } = instance
				const subTree = instance.subTree = instance.render()
				patch(null, subTree, container)
				instance.el = vnode.el = subTree.el
				instance.isMounted = true
				if (mounted) mounted()
			} else {
				let { next, vnode } = instance
				if (next){
					next.el = vnode.el
					next.component = instance
					instance.vnode = next
					instance.nextTree = null
					updateProps(instance, next.props)
				} else {
					next = vnode
				}

				const nextTree = instance.render()
				const prevTree = instance.subTree
				instance.subTree = nextTree
				patch(prevTree, nextTree, parentNode(prevTree.el))
				next.el = nextTree.el

			}
		})
	}

	function render(vnode, container){
		if (vnode === null){

		} else {
			patch(null, vnode, container)
		}
	}

	return {
		render,
		createApp: createAppAPI(render)
	}
}
