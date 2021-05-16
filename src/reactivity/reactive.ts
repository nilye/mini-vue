import { track, trigger } from "./effect";

const ReactiveFlags = '__v_isReactive'

export function reactive(raw: object){
	return createReactiveObject(raw)
}

function createReactiveObject(raw: any){
	if (raw.ReactiveFlags){
		return raw
	}

	return new Proxy(raw, {
		get(target, key){
			if (key === ReactiveFlags){
				return true
			}
			track(target, key)
			return Reflect.get(target, key)
		},
		set(target, key, value){
			const result = Reflect.set(target, key, value)
			trigger(target, key)
			return result
		}

		// has, delete, ownkeys
	})
}
