import { effect } from "./effect";

export function watch(source, cb){
	doWatch(source, cb)
}

export function watchEffect(cb){
	doWatch(cb, null)
}


function doWatch(
	source: () => unknown,
	cb: (newVal, oldValue) => unknown,
) {

	let oldValue
	const scheduler = () => {
		if (cb){
			const newValue = runner()
			console.log(newValue)
			if (newValue !== oldValue){
				cb(newValue, oldValue)
				oldValue = newValue
			}
		} else {
			runner()
		}
	}

	const runner = effect(source, {
		lazy: true,
		scheduler
	})

	if (cb){
		oldValue = runner()
	} else {
		runner()
	}

}
