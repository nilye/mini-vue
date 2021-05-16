import { track, trigger } from "./effect";

class RefImpl<T> {
	private _value: T
	public readonly __v_isRef = true

	constructor(rawValue: T) {
		this._value = rawValue
	}

	get value() {
		track(this, 'value')
		return this._value
	}

	set value(newValue) {
		if (newValue !== this.value) {
			this._value = newValue
			trigger(this, 'value')
		}
	}
}

export function isRef(ref) {
	return ref && ref.__v_isRef === true
}

export function ref(rawValue) {
	if (isRef(rawValue)) {
		return rawValue
	}
	return new RefImpl(rawValue)
}
