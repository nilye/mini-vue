import { createRenderer } from "./renderer";
import { nodeOps } from "./nodeOp";

let renderer
function ensureRenderer(){
	return renderer || (renderer = createRenderer(nodeOps))
}

export const createApp = (rootComponent, rootProps) => {
	const app = ensureRenderer().createApp(rootComponent, rootProps)

	return app
}
export * from './vnode'
export * from './component'
export * from './lifeCycle'
