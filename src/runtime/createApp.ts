import { createVNode } from "./vnode";

export function createAppAPI(
	render
){
	return function createApp(rootComponent, rootProps){

		let isMounted = false

		const app = {
			config: {},
			_container: null,

			mount(rootContainer){
				if (!isMounted){
					const vnode = createVNode(rootComponent, rootProps, null)
					render(vnode, rootContainer)
					isMounted = true
					app._container = rootContainer

				}
			},

			unmounted(){
				if (isMounted){
					render(null, app._container)
				}
			}
		}

		return app
	}
}
