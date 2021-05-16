import { effect, ReactiveEffect, track, trigger } from "./effect";

class ComputedRefImpl<T> {
	private _value: T
	private _dirty = true

	public readonly effect: ReactiveEffect<T>

	constructor(fn){
		this.effect = effect(fn, {
			lazy: true,
			scheduler: () => {
				if (!this._dirty){
					this._dirty = true
					trigger(this, 'value')
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

}

export function computed(fn: any){
	return new ComputedRefImpl(fn)
}
