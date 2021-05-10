import { effect, ReactiveEffect, track, trigger } from "./effect";
import { TriggerOpType } from "./operation";

class ComputedRefImpl<T> {
	private _value: T
	private _dirty = true

	public readonly effect: ReactiveEffect<T>

	constructor(
		getter: () => T,
		private readonly _setter: (newValue: any) => unknown = () => void 0,
	){
		this.effect = effect(getter, {
			lazy: true,
			scheduler: () => {
				if (!this._dirty){
					this._dirty = true
					trigger(this, TriggerOpType.SET, 'value')
				}
			}
		})
	}

	get value() {
		if (this._dirty){
			this._value = this.effect()
			this._dirty = false
		}
		track(this, 'value')
		return this._value
	}

	set value (newValue){
		this._setter(newValue)
	}

}

export function computed(
	getterOrOptions: any
){
	let getter
	let setter

	if (typeof getterOrOptions === 'function'){
		getter = getterOrOptions
		setter = () => void 0
	} else {
		getter = getterOrOptions.get
		setter = getterOrOptions.set
	}

	return new ComputedRefImpl(
		getter,
		setter
	)
}
