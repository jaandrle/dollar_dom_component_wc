/* jshint esversion: 6,-W097, -W040, browser: true, expr: true, undef: true */
/* global $dom, customElements */
$dom.defineElement= (function(){
    /**
     * @typedef T_WC_ATT_Config
     * @type {object}
     * @property {false|string} [name_html] Controls attribute is available in HTML representation of the Element. `False` means no, `Undefined` means converts `name_html`, any string is used as name.
     * @property {boolean} [observed=true] Toggles listener for changing this attribute/property in JS/HTML.
     * @property {Boolean<>|String<>|Number<>} [type=String] In fact, use for converting from HTML attribute!
     * @property {boolean|string|number} [initial] Initial value, use the same type as `type`.
     * */
    /**
     * @callback Attribute
     * @param {string} name Attribute name (camel case is preferred) in JS
     * @param {T_WC_ATT_Config} config
     * */
    /**
     * @typedef T_WC_SideEffects_ShadowRoot
     * @type {object}
     * @property {false|"open"|"closed"} mode
     * @property {object} head Pseudo element representing “common place” for styles shared across component instances.
     * @property {(style_text: string, parent?: string)=> void} head.appendStyle CSS can be written in generalize form with(out) shadow root by `parent`. This string will be replaced with correct parent selector (`tag_name` when no shadow root, empty elsewhere).
     * @property {<T extends Record<string, any>>(varibales: T, scoped?: boolean= true)=> Record<keyof T,string>} head.cssVariables Defines CSS variables in the form of `--local-NAME: var(--NAME, DEFAULT)` based on `Record<variable name, default value>`. If `scoped`, the tag name is prepend for given css variable name. Returns object with the same keys and css string representing variable.
     * @property {(dom_data: HTMLLinkElement)=> void} head.appendLink
     * */
    /**
     * When `mode=false`, it is possible to simulate some shadow root behaviour.
     * @typedef T_WC_SideEffects_false_params
     * @type {object}
     * @property {"native"|"simulated"} [slots=native] The `<slot>` behaviour like for Shadow Root by using `params= { slots: "simulated" }`.
     * @property {boolean} [scoped=false] In fact, applies `tagName *{all: revert;}`.
     * */
    /**
     * @typedef T_WC_SideEffects
     * @type {object}
     * @property {Attribute} attribute
     * @property {(mode: false|"open"|"closed", params?: T_WC_SideEffects_false_params)=> T_WC_SideEffects_ShadowRoot} shadowRoot Sets shadow root (see [Using shadow DOM - Web Components | MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM#basic_usage)).
     * */
    /**
     * HTML attributes for the element, defined by {@link Attribute} in {@link T_WC_SideEffects}.
     * @typedef T_WC_Attributes
     * @type {object}
     * */
    /**
     * This defines Autonomous Custom Element (see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-core-concepts}).
     * (Polyfill https://github.com/ungap/custom-elements).
     * @template {keyof $domCustomElementRegistry} T
     * @param {T} tag_name Custom element tag name in the form `something-something` (e. g. `x-app`, `x-screen`, `app-element`, …)
     * @param {(config: T_WC_SideEffects)=> $domCustomElementRegistry[T]["funConfig"]} funConfig This function is called before `class extends HTMLElement` definition. This is place to set up custom element. Returns classical “`$dom.component`”, which is called when `connectedCallback`.
     * @returns {$domCustomElementRegistry[T]["returns"]}
     * */
    return function defineCustomElement(tag_name, funConfig){
        const /* temporaly */ attributes= [], styles= [];
        /** @type {WeakMap<HTMLElement, { el_shadow: ShadowRoot }>} */
        const storage= new WeakMap();
        
        let is_config_phase= true;
        const shadow_root= { mode: false }; Object.assign(shadow_root, {
            update(mode, params){
                if(this._locked) throw new Error("Shadow Root can't be changed multiple times!");
                this._locked= true;
                this.mode= mode;
                if(mode===false){
                    this.params= Object.assign({ slots: "native" }, params);
                }
                return shadow_root;
            },
            head: {
                style: undefined, links: undefined,
                appendStyle: configOnlyFunction(function(style_text, parent){
                    const is_shadow= shadow_root.mode!==false;
                    if(!this.style) this.style= Object.assign(document.createElement("style"), {
                        type: "text/css",
                        textContent: is_shadow || !shadow_root.params.scoped ? "" : tag_name+" *{ all: revert; }"
                    });
                    if(parent) style_text= style_text.replace(new RegExp(parent, "g"), is_shadow ? "" : tag_name);
                    if(!is_shadow) style_text= style_text.replace(/:host/g, tag_name);
                    this.style.appendChild(Object.assign(document.createTextNode(style_text.trim())));
                }),
                cssVariables: configOnlyFunction(function(vars, scoped= true){
                    const out= {};
                    const css= Object.entries(vars).map(function([ varible, initial= null ]){
                        const initial_str= initial===null ? "" : (initial==="" ? `, "${initial}"` : `, ${initial}`);
                        const variable_name= scoped ? tag_name+"-"+varible : varible;
                        out[varible]= `var(--local-${variable_name})`;
                        return `--local-${variable_name}: var(--${variable_name}${initial_str});`;
                    }).join(" ");
                    this.appendStyle(`& *{${css}}`, "&");
                    return out;
                }),
                appendLink: configOnlyFunction(function(dom_data){
                    if(!this.links) this.links= document.createDocumentFragment();
                    this.links.appendChild(Object.assign(document.createElement("link"), dom_data));
                }),
                clone(mode){
                    const out= [];
                    if(this.style) out.push(this.style.cloneNode(mode));
                    if(this.links) out.push(this.links.cloneNode(mode));
                    return out;
                }
            }
        });
        const funComponent= funConfig({
            tag_name,
            attribute: configOnlyFunction(attribute.bind(attributes)),
            shadowRoot: configOnlyFunction((mode, params)=> shadow_root.update(mode, params))
        });
        is_config_phase= false;
        const is_props_observed= attributes.find(({ name_html, observed })=> name_html===false&&observed);
        if(shadow_root.mode===false){
            const { style, links }= shadow_root.head;
            if(style) document.head.appendChild(style);
            if(links) document.head.appendChild(links);
            Reflect.deleteProperty(shadow_root, "head");
        }
        
        const CustomHTMLElement= class extends HTMLElement{
            static get observedAttributes(){ return attributes.filter(({ observed, name_html })=> observed && name_html).map(({ name_html })=> name_html); }
            connectedCallback(){
                const def= {};
                for(const { name, name_html, initial } of attributes){
                    if(name_html && !this.hasAttribute(name_html) || typeof this[name]==="undefined") this[name]= initial;
                    def[name]= this[name];
                }
                storage.get(this).dom= funComponent.call(this, def);
                if(!shadow_root.mode){
                    const slots= processSlots(this, shadow_root);
                    storage.get(this).dom.mount(this);
                    if(slots) slots();
                    return;
                }

                const { el_shadow }= storage.get(this);
                el_shadow.append(...shadow_root.head.clone(true));
                storage.get(this).dom.mount(el_shadow);
            }
            attributeChangedCallback(name, value_old, value_new){
                const { dom }= storage.get(this);
                if(!dom||value_new===value_old) return false;
                dom.update({ [hyphensToCamelCase(name)]: value_new });
            }
            disconnectedCallback(){ storage.get(this).dom= storage.get(this).dom.destroy(); }
            constructor(data){
                super();
                const { mode }= shadow_root;

                const s= {};
                if(is_props_observed) s.props= new Map();
                if(mode) s.el_shadow= this.attachShadow({ mode });
                storage.set(this, s);
                
                if(data) $dom.assign(this, data);
                return this;
            }
            dispatchEvent(event, params){
                if(typeof event!=="string") return super.dispatchEvent(event);
                return super.dispatchEvent(new CustomEvent(event, params));
            }
        };
        Reflect.defineProperty(CustomHTMLElement, "tagName", { value: tag_name });
        Reflect.defineProperty(CustomHTMLElement, "name", { value: hyphensToCamelCase("HTML-"+tag_name+"-element") });
        for(const { name, name_html, observed, type } of attributes){
            if(!name_html && !observed) continue;
            Reflect.defineProperty(CustomHTMLElement.prototype, name, name_html ? {
                get(){ return type===String ?
                        this.getAttribute(name_html) :
                        ( type===Boolean ? this.hasAttribute(name_html) : Number(this.getAttribute(name_html)) ); },
                set(val){ return type!==Boolean && typeof val !== "undefined" ?
                        this.setAttribute(name_html, val) :
                        ( val ? this.setAttribute(name_html, "") : this.removeAttribute(name_html) ); }
            } : {
                get(){ return storage.get(this).props.get(name); },
                set(val_new){
                    const p= storage.get(this).props;
                    this.attributeChangedCallback(name, p.get(name), val_new);
                    return p.set(name, val_new);
                }
            });
        }
        customElements.define(tag_name, CustomHTMLElement);
        return CustomHTMLElement;
        
        function configOnlyFunction(callback){
            return function(...params){
                if(is_config_phase) return callback.call(this, ...params);
                throw new SyntaxError(`This function can be called only in root of "funConfig" function!`);
            };
        }
    };

    function attribute(name, { name_html, initial, type= String, observed= true }= {}){
        if(typeof name_html==="undefined")
            name_html= camelCaseToHyphens(name);
        this.push({ name, name_html, observed, type, initial });
    }
    
    function hyphensToCamelCase(text){ return text.replace(/-([a-z])/g, (_, l)=> l.toUpperCase()); }
    function camelCaseToHyphens(text){ return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(); }
    /** @param {HTMLElement} element */
    function processSlots(element, shadow_root){
        if(shadow_root.params.slots!=="simulated")
            return false;

        const els_hosts= Object.values(Array.from(element.children)
            .reduce(function(out, curr){
                const { slot }= curr;
                if(!Reflect.has(out, slot)){
                    Reflect.set(out, slot, curr);
                    return out;
                }
                const parent= Reflect.get(out, slot);
                if(parent instanceof DocumentFragment){
                    parent.appendChild(curr);
                    return out;
                }
                const f= Object.assign(document.createDocumentFragment(), { slot });
                f.append(parent, curr);
                Reflect.set(out, slot, f);
                return out;
            }, {}));
        if(!els_hosts.length) return false;

        return function process(){
            const els_slots= toElsNamesDictionary(element.querySelectorAll("slot"));
            for(const el of els_hosts)
                replace(Reflect.get(els_slots, el.slot), el);
        };
        
        /** @param {HTMLElement} el_slot @param {HTMLElement} el_host */
        function replace(el_slot, el_host){
            if(!el_slot) return el_host.remove();
            const { className }= el_slot;
            if(className){
                if(el_host instanceof DocumentFragment)
                    Array.from(el_host.children).forEach(el=> el.classList.add(...className.split(" ")));
                else
                    el_host.classList.add(...className.split(" "));
            }
            el_slot.parentElement.insertBefore(el_host, el_slot);
            el_slot.remove();
        }
        function toElsNamesDictionary(els_query){
            return Array.from(els_query).reduce((o, el)=> (Reflect.set(o, el.name, el), o), {});
        }
    }
})();
