var vue = (function (exports) {
	'use strict';

	const targetMap = new WeakMap();
	let activeEffect;
	function effect(fn, options = {}) {
	    const effect = createReactiveEffect(fn, options);
	    if (!options.lazy) {
	        effect();
	    }
	    return effect;
	}
	function createReactiveEffect(fn, options) {
	    const effect = function () {
	        try {
	            activeEffect = effect;
	            return fn();
	        }
	        finally {
	            activeEffect = null;
	        }
	    };
	    effect._isEffect = true;
	    effect.active = true;
	    effect.raw = fn;
	    effect.options = options;
	    return effect;
	}
	function track(target, key) {
	    let depsMap = targetMap.get(target);
	    if (!depsMap) {
	        targetMap.set(target, (depsMap = new Map()));
	    }
	    let dep = depsMap.get(key);
	    if (!dep) {
	        depsMap.set(key, (dep = new Set()));
	    }
	    if (!dep.has(activeEffect)) {
	        dep.add(activeEffect);
	    }
	}
	function trigger(target, key) {
	    const depsMap = targetMap.get(target);
	    if (!depsMap)
	        return;
	    const effects = new Set();
	    const addEffects = (effectsToAdd) => {
	        if (effectsToAdd) {
	            effectsToAdd.forEach(effect => {
	                if (effect !== activeEffect) {
	                    effects.add(effect);
	                }
	            });
	        }
	    };
	    if (key != null) {
	        addEffects(depsMap.get(key));
	    }
	    const run = (effect) => {
	        if (effect.options.scheduler) {
	            effect.options.scheduler();
	        }
	        else {
	            effect();
	        }
	    };
	    effects.forEach(run);
	}

	class RefImpl {
	    constructor(rawValue) {
	        this.__v_isRef = true;
	        this._value = rawValue;
	    }
	    get value() {
	        track(this, 'value');
	        return this._value;
	    }
	    set value(newValue) {
	        if (newValue !== this.value) {
	            this._value = newValue;
	            trigger(this, 'value');
	        }
	    }
	}
	function isRef(ref) {
	    return ref && ref.__v_isRef === true;
	}
	function ref(rawValue) {
	    if (isRef(rawValue)) {
	        return rawValue;
	    }
	    return new RefImpl(rawValue);
	}

	class ComputedRefImpl {
	    constructor(fn) {
	        this._dirty = true;
	        this.effect = effect(fn, {
	            lazy: true,
	            scheduler: () => {
	                if (!this._dirty) {
	                    this._dirty = true;
	                    trigger(this, 'value');
	                }
	            }
	        });
	    }
	    get value() {
	        if (this._dirty) {
	            this._value = this.effect();
	            this._dirty = false;
	        }
	        track(this, 'value');
	        return this._value;
	    }
	}
	function computed(fn) {
	    return new ComputedRefImpl(fn);
	}

	const ReactiveFlags = '__v_isReactive';
	function reactive(raw) {
	    return createReactiveObject(raw);
	}
	function createReactiveObject(raw) {
	    if (raw.ReactiveFlags) {
	        return raw;
	    }
	    return new Proxy(raw, {
	        get(target, key) {
	            if (key === ReactiveFlags) {
	                return true;
	            }
	            track(target, key);
	            return Reflect.get(target, key);
	        },
	        set(target, key, value) {
	            const result = Reflect.set(target, key, value);
	            trigger(target, key);
	            return result;
	        }
	        // has, delete, ownkeys
	    });
	}

	function watch(source, cb) {
	    doWatch(source, cb);
	}
	function watchEffect(cb) {
	    doWatch(cb, null);
	}
	function doWatch(source, cb) {
	    let oldValue;
	    const scheduler = () => {
	        if (cb) {
	            const newValue = runner();
	            console.log(newValue);
	            if (newValue !== oldValue) {
	                cb(newValue, oldValue);
	                oldValue = newValue;
	            }
	        }
	        else {
	            runner();
	        }
	    };
	    const runner = effect(source, {
	        lazy: true,
	        scheduler
	    });
	    if (cb) {
	        oldValue = runner();
	    }
	    else {
	        runner();
	    }
	}

	function createVNode(type, props, children) {
	    return {
	        type,
	        props,
	        shapeFlag: typeof type === 'string' ? 'element' : 'component',
	        el: null,
	        children
	    };
	}
	const h = createVNode;

	function createAppAPI(render) {
	    return function createApp(rootComponent, rootProps) {
	        let isMounted = false;
	        const app = {
	            config: {},
	            _container: null,
	            mount(rootContainer) {
	                if (!isMounted) {
	                    const vnode = createVNode(rootComponent, rootProps, null);
	                    render(vnode, rootContainer);
	                    isMounted = true;
	                    app._container = rootContainer;
	                }
	            },
	            unmounted() {
	                if (isMounted) {
	                    render(null, app._container);
	                }
	            }
	        };
	        return app;
	    };
	}

	function initProps(instance, rawProps) {
	    const props = {};
	    const attrs = {};
	    const propsOptions = instance.options.props;
	    if (rawProps) {
	        for (let key in rawProps) {
	            const value = rawProps[key];
	            if (propsOptions && (key in propsOptions || propsOptions.includes(key))) {
	                props[key] = value;
	            }
	            else {
	                attrs[key] = value;
	            }
	        }
	    }
	    instance.props = props;
	    instance.attrs = attrs;
	}
	function updateProps(instance, newProps) {
	    const propsOptions = instance.options.props;
	    if (newProps) {
	        for (let key in newProps) {
	            const value = newProps[key];
	            if (propsOptions && (key in propsOptions || propsOptions.includes(key))) {
	                if (instance.props[key] !== value) {
	                    instance.props[key] = value;
	                }
	            }
	            else if (instance.attrs[key] !== value) {
	                instance.attrs[key] = value;
	            }
	        }
	    }
	}

	function initSlots(instance, children) {
	    instance.slots = {};
	    instance.slots.default = () => children;
	}

	function emit(instance, event, ...args) {
	    const props = instance.vnode.props;
	    let handlerName = 'on' + event[0].toUpperCase() + event.slice(1);
	    let handler = props[handlerName];
	    if (handler) {
	        handler(...args);
	    }
	}

	function createComponentInstance(vnode) {
	    const options = vnode.type;
	    const instance = {
	        vnode,
	        subTree: null,
	        next: null,
	        options: options,
	        name: options.name,
	        propsOptions: options.props,
	        render: null,
	        props: null,
	        attrs: null,
	        slots: null,
	        emit: null,
	        setup: vnode.type.setup,
	        isMounted: false,
	        mounted: null,
	        unmounted: null,
	        update: null
	    };
	    instance.emit = emit.bind(null, instance);
	    return instance;
	}
	exports.currentInstance = null;
	const getCurrentInstance = () => exports.currentInstance;
	function setupComponent(instance) {
	    const { props, children } = instance.vnode;
	    initProps(instance, props);
	    initSlots(instance, children);
	    const { setup } = instance.options;
	    if (setup) {
	        const setupContext = createSetupContext(instance);
	        exports.currentInstance = instance;
	        const setupResult = setup(setupContext);
	        exports.currentInstance = null;
	        if (typeof setupResult === 'function') {
	            instance.render = setupResult;
	        }
	        else {
	            instance.setupState = setupResult;
	        }
	    }
	}
	function createSetupContext(instance) {
	    return {
	        attrs: instance.attrs,
	        props: instance.props,
	        slots: instance.slots,
	        emit: instance.emit
	    };
	}

	function createRenderer(options) {
	    return baseCreateRenderer(options);
	}
	function baseCreateRenderer(options) {
	    const { insert, createElement, patchProp, setElementText, parentNode, remove } = options;
	    function patch(n1, n2, container) {
	        // not same type, unmount old tree
	        if (n1 && n1.type !== n2.type) {
	            n1 = null;
	        }
	        if (n2.shapeFlag === 'element') {
	            processElement(n1, n2, container);
	        }
	        else if (n2.shapeFlag === 'component') {
	            processComponent(n1, n2, container);
	        }
	    }
	    function processElement(n1, n2, container) {
	        if (n1 == null)
	            mountElement(n2, container);
	        else
	            patchElement(n1, n2);
	    }
	    function mountElement(vnode, container) {
	        let { type, props, children } = vnode;
	        let el = vnode.el = createElement(type);
	        if (props) {
	            for (const key in props) {
	                patchProp(el, key, null, props[key]);
	            }
	        }
	        if (typeof children === 'string') {
	            setElementText(el, children);
	        }
	        else {
	            if (!Array.isArray(children))
	                children = [children];
	            for (let n of children) {
	                patch(null, n, el);
	            }
	        }
	        insert(el, container, null);
	    }
	    function patchElement(n1, n2) {
	        const el = n2.el = n1.el;
	        const oldProps = n1.props;
	        const newProps = n2.props;
	        for (const key in newProps) {
	            if (oldProps[key] !== newProps[key]) {
	                patchProp(el, key, oldProps[key], newProps[key]);
	            }
	        }
	        patchChildren(n1, n2, el);
	    }
	    function patchChildren(n1, n2, container) {
	        const c1 = n1 && n1.children;
	        const c2 = n2.children;
	        if (typeof c2 === 'string') {
	            if (typeof c1 === 'string' && c1 !== c2) {
	                setElementText(container, c1);
	            }
	        }
	        else {
	            if (typeof c1 === 'string') {
	                setElementText(container, '');
	                c2.forEach(c => {
	                    mountElement(c, container);
	                });
	            }
	            else {
	                let l1 = c1.length, l2 = c2.length;
	                const commonLength = Math.min(l1, l2);
	                for (let i = 0; i < commonLength; i++) {
	                    patch(c1[i], c2[i], container);
	                }
	                if (l2 > l1) {
	                    c2.slice(l1).forEach(c => {
	                        patch(null, c, container);
	                    });
	                }
	                else if (l2 < l1) {
	                    c1.slice(l2).forEach(c => {
	                        unmount(c);
	                    });
	                }
	            }
	        }
	    }
	    function unmount(vnode) {
	        if (vnode.shapeFlag === 'element') {
	            remove(vnode.el);
	        }
	        else if (vnode.shapeFlag === 'component') {
	            unmountComponent(vnode.component);
	        }
	    }
	    function processComponent(n1, n2, container) {
	        if (n1 == null)
	            mountComponent(n2, container);
	        else
	            updateComponent(n1, n2);
	    }
	    function unmountComponent(instance) {
	        const { unmounted, subTree } = instance;
	        unmount(subTree);
	        instance.isMounted = false;
	        if (unmounted) {
	            unmounted();
	        }
	    }
	    function mountComponent(vnode, container) {
	        const instance = vnode.component = createComponentInstance(vnode);
	        setupComponent(instance);
	        setupRenderEffect(instance, vnode, container);
	    }
	    function updateComponent(n1, n2) {
	        const instance = n2.component = n1.component;
	        instance.next = n2;
	        instance.update();
	    }
	    function setupRenderEffect(instance, vnode, container) {
	        instance.update = effect(function componentEffect() {
	            if (!instance.isMounted) {
	                const { mounted } = instance;
	                const subTree = instance.subTree = instance.render();
	                patch(null, subTree, container);
	                instance.el = vnode.el = subTree.el;
	                instance.isMounted = true;
	                if (mounted)
	                    mounted();
	            }
	            else {
	                let { next, vnode } = instance;
	                if (next) {
	                    next.el = vnode.el;
	                    next.component = instance;
	                    instance.vnode = next;
	                    instance.nextTree = null;
	                    updateProps(instance, next.props);
	                }
	                else {
	                    next = vnode;
	                }
	                const nextTree = instance.render();
	                const prevTree = instance.subTree;
	                instance.subTree = nextTree;
	                patch(prevTree, nextTree, parentNode(prevTree.el));
	                next.el = nextTree.el;
	            }
	        });
	    }
	    function render(vnode, container) {
	        if (vnode === null) ;
	        else {
	            patch(null, vnode, container);
	        }
	    }
	    return {
	        render,
	        createApp: createAppAPI(render)
	    };
	}

	const nodeOps = {
	    createElement: (tag) => document.createElement(tag),
	    patchProp: (el, key, oldValue, newValue) => {
	        if (key == 'value') {
	            el.value = newValue;
	        }
	        else if (key.startsWith('on')) {
	            const eventName = key.toLowerCase();
	            el[eventName] = newValue;
	        }
	        else if (oldValue !== newValue) {
	            el.setAttribute(key, newValue);
	        }
	        else if (newValue == null) {
	            el.removeAttribute(key);
	        }
	    },
	    setElementText: (el, text) => el.textContent = text,
	    insert: (child, parent, anchor) => {
	        parent.insertBefore(child, anchor || null);
	    },
	    parentNode: (el) => el.parentNode,
	    remove: (el) => {
	        const parent = el.parentNode;
	        if (parent) {
	            parent.removeChild(el);
	        }
	    }
	};

	function onMounted(cb) {
	    const instance = getCurrentInstance();
	    instance.mounted = cb;
	}
	function onUnmounted(cb) {
	    const instance = getCurrentInstance();
	    instance.unmounted = cb;
	}

	let renderer;
	function ensureRenderer() {
	    return renderer || (renderer = createRenderer(nodeOps));
	}
	const createApp = (rootComponent, rootProps) => {
	    const app = ensureRenderer().createApp(rootComponent, rootProps);
	    return app;
	};

	exports.computed = computed;
	exports.createApp = createApp;
	exports.createComponentInstance = createComponentInstance;
	exports.createVNode = createVNode;
	exports.effect = effect;
	exports.getCurrentInstance = getCurrentInstance;
	exports.h = h;
	exports.isRef = isRef;
	exports.onMounted = onMounted;
	exports.onUnmounted = onUnmounted;
	exports.reactive = reactive;
	exports.ref = ref;
	exports.setupComponent = setupComponent;
	exports.track = track;
	exports.trigger = trigger;
	exports.watch = watch;
	exports.watchEffect = watchEffect;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

}({}));
