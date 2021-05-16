export const nodeOps = {
	createElement: (tag) => document.createElement(tag),
	patchProp: (el, key, oldValue, newValue) => {
		if (key == 'value') {
			el.value = newValue
		} else if (key.startsWith('on')) {
			const eventName = key.toLowerCase()
			el[eventName] = newValue
		} else if (oldValue !== newValue) {
			el.setAttribute(key, newValue)
		} else if (newValue == null) {
			el.removeAttribute(key)
		}
	},
	setElementText: (el, text) => el.textContent = text,
	insert: (child, parent, anchor) => {
		parent.insertBefore(child, anchor || null)
	},
	parentNode: (el) => el.parentNode,
	remove: (el) => {
		const parent = el.parentNode
		if (parent){
			parent.removeChild(el)
		}
	}
}
