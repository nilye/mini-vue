type Dep = Set<Function>
const targetMap = new WeakMap<any, Map<any, Dep>>()

let activeEffect

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

export function effect<T = any>(
	fn: () => T,
	options: any = {}
) {
	const effect = createReactiveEffect(fn, options)
	if (!options.lazy) {
		effect()
	}
	return effect
}

function createReactiveEffect<T>(
	fn: () => T,
	options: any
) {
	const effect = function () {
		try {
			activeEffect = effect
			return fn()
		} finally {
			activeEffect = null
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
	key: string | number | symbol
) {
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		targetMap.set(target, (depsMap = new Map()))
	}

	let dep = depsMap.get(key)
	if (!dep) {
		depsMap.set(key, (dep = new Set()))
	}
	if (!dep.has(activeEffect)) {
		dep.add(activeEffect)
	}
}

export function trigger(
	target: object,
	key: string | number | symbol,
) {
	const depsMap = targetMap.get(target)
	if (!depsMap) return

	const effects = new Set()
	const addEffects = (effectsToAdd) => {
		if (effectsToAdd) {
			effectsToAdd.forEach(effect => {
				if (effect !== activeEffect) {
					effects.add(effect)
				}
			})
		}
	}

	if (key != null) {
		addEffects(depsMap.get(key))
	}

	const run = (effect) => {
		if (effect.options.scheduler) {
			effect.options.scheduler()
		} else {
			effect()
		}
	}

	effects.forEach(run)
}
