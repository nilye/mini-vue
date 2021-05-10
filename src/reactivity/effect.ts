import { TriggerOpType } from "./operation";

type Dep = Set<Function>
const targetMap = new WeakMap<any, Map<any, Dep>>()

let activeEffect
const effectStack: ReactiveEffect[] = []

export interface ReactiveEffect<T = any> {
	(): T,
	_isEffect: boolean,
	active: boolean,
	raw: () => T,
	options: {
		lazy?: boolean,
		scheduler: () => void
	}
}

export function isEffect(fn: any): fn is ReactiveEffect{
	return fn && fn._isEffect === true
}

export function effect<T = any>(
	fn: () => T,
	options: any = {}
){
	if (isEffect(fn)){
		fn = fn.raw
	}
	const effect = createReactiveEffect(fn, options)
	if (!options.lazy){
		effect()
	}
	return effect
}

function createReactiveEffect<T>(
	fn: () => T,
	options: any
){
	const effect = function (){
		if (!effect.active){
			return options.scheduler ? undefined : fn()
		}
		if (!effectStack.includes(effect)){
			try {
				effectStack.push(effect)
				activeEffect = effect
				return fn()
			} finally {
				effectStack.pop()
				activeEffect = effectStack[effectStack.length - 1]
			}
		}
	}
	effect._isEffect = true
	effect.active = true
	effect.raw = fn
	effect.options = options
	return effect
}


export function track(
	target: object,
	key: string
){
	let depsMap = targetMap.get(target)
	if (!depsMap){
		targetMap.set(target, (depsMap = new Map()))
	}

	let dep = depsMap.get(key)
	if (!dep){
		depsMap.set(key, (dep = new Set()))
	}
	if (!dep.has(activeEffect)){
		dep.add(activeEffect)
		// activeEffect.deps.push(dep)
	}
}

export function trigger(
	target: object,
	type: TriggerOpType,
	key: unknown,
	newValue?: unknown,
	oldValue?: unknown
){
	const depsMap = targetMap.get(target)
	if (!depsMap) return

	const effects = new Set()
	const addEffects = (effectsToAdd) => {
		if (effectsToAdd){
			effectsToAdd.forEach(effect => {
				if (effect !== activeEffect){
					effects.add(effect)
				}
			})
		}
	}

	if (key != null){
		addEffects(depsMap.get(key))
	}

	switch (type){
		case TriggerOpType.ADD:
			if (Array.isArray(target) && typeof key === 'number'){
				addEffects(depsMap.get('length'))
			}
			break
		case TriggerOpType.DELETE:
			if (Array.isArray(target)){
				addEffects(depsMap.get('length'))
			}
			break
		case TriggerOpType.SET:
			//
			break
	}

	const run = (effect) => {
		if (effect.options.scheduler){
			effect.options.scheduler()
		} else {
			effect()
		}
	}

	effects.forEach(run)
}
