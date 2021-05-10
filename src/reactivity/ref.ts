import { track, trigger } from "./effect";
import { TrackOpType, TriggerOpType } from "./operation";

class RefImpl<T> {
	private _value: T
	public readonly __v_isRef = true

	constructor (rawValue: T){
		this._value = rawValue
	}

	get value(){
		track(this, 'value')
		return this._value
	}

	set value(newValue){
		if (newValue !== this.value){
			this._value = newValue
			trigger(this, TriggerOpType.SET, 'value', newValue)
		}
	}
}

export function isRef(ref){
	return ref && ref.__v_isRef === true
}

function createRef(rawValue){
	if (isRef(rawValue)){
		return rawValue
	}
	return new RefImpl(rawValue)
}

export function ref(rawValue){
	return createRef(rawValue)
}

export function unref(ref){
	return isRef(ref) ? ref.value : ref
}


class ObjectRefImpl<T> {
	public readonly  __v_isRef = true

	constructor(private readonly _obj, private readonly _key){}

	get value (){
		return this._obj[this._key]
	}

	set value(newValue){
		this._obj[this._key] = newValue
	}

}

export function toRef(obj, key){
	return isRef(obj[key]) ? obj[key] : new ObjectRefImpl(obj, key)
}
