import { getCurrentInstance } from "./component";

export function onMounted(cb){
	const instance = getCurrentInstance()
	instance.mounted = cb
}

export function onUnmounted(cb){
	const instance = getCurrentInstance()
	instance.unmounted = cb
}
