/* jshint esversion: 6,-W097, -W040, browser: true, expr: true, undef: true */
/* global $dom, customElements */
$dom.wc= (function(){
    let el_style;
    /**
     * @typedef T_WC_ATT_Config
     * @type {object}
     * @template {Boolean|String|Number} T
     * @property {false|string} [name_html] Controls attribute is available in HTML representation of the Element. `False` means no, `Undefined` means converts `name_html`, any string is used as name.
     * @property {boolean} [observed=true]
     * @property {T} [type=String]
     * @property {T} [initial]
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
     * @property {(dom_data: HTMLLinkElement)=> void} head.appendLink
     * */
    /**
     * @typedef T_WC_SideEffects
     * @type {object}
     * @property {Attribute} attribute
     * @property {(mode: false|"open"|"closed")=> T_WC_SideEffects_ShadowRoot} shadowRoot Sets shadow root (see [Using shadow DOM - Web Components | MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM#basic_usage))
     * */
    /**
     * HTML attributes for the element, defined by {@link Attribute} in {@link T_WC_SideEffects}.
     * @typedef T_WC_Attributes
     * @type {object}
     * */
    /**
     * @param {string} tag_name Custom element tag name in the form `something-something` (e. g. `x-app`, `x-screen`, `app-element`, …)
     * @param {(config: T_WC_SideEffects)=> (initial: T_WC_Attributes)=> $dom.component_main} funConfig
     * */
    return function defineCustomElement(tag_name, funConfig){
        const /* temporaly */ attributes= [], styles= [];
        /** @type {WeakMap<HTMLElement, { el_shadow: ShadowRoot }>} */
        const storage= new WeakMap();
        
        let is_config_phase= true;
        const shadow_root= { mode: false }; Object.assign(shadow_root, {
            update(mode){
                if(this._locked) throw new Error("Shadow Root can't be changed multiple times!");
                this._locked= true;
                this.mode= mode;
                return shadow_root;
            },
            head: {
                appendStyle: configOnlyFunction(function(style_text, parent){
                    if(!this.style) this.style= Object.assign(document.createElement("style"), { type: "text/css" });
                    const is_shadow= shadow_root.mode!==false;
                    if(parent) style_text= style_text.replace(new RegExp(parent, "g"), is_shadow ? "" : tag_name);
                    if(is_shadow) style_text= style_text.replace(/:host/g, tag_name);
                    this.style.appendChild(Object.assign(document.createTextNode(style_text.trim())));
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
            attribute: configOnlyFunction(attribute.bind(null, attributes)),
            shadowRoot: configOnlyFunction(mode=> shadow_root.update(mode))
        });
        is_config_phase= false;
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
                this.$dom= funComponent.call(this, def);
                if(!shadow_root.mode) return this.$dom.mount(this);

                const { el_shadow }= storage.get(this);
                el_shadow.append(...shadow_root.head.clone(true));
                this.$dom.mount(el_shadow);
            }
            attributeChangedCallback(name, value_old, value_new){
                if(!this.$dom||value_new===value_old) return false;
                this.$dom.update({ [hyphensToCamelCase(name)]: value_new });
            }
            disconnectedCallback(){
                this.$dom= this.$dom.destroy();
            }
            constructor(){
                super();
                if(!shadow_root.mode) return;

                storage.set(this, { el_shadow: this.attachShadow({ mode: shadow_root.mode }) });
            }
        };
        Object.defineProperty(CustomHTMLElement, "name", { value: hyphensToCamelCase("HTML-"+tag_name+"-element") });
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
                get(){ return this["__"+name]; },
                set(val_new){
                    const n= "__"+name;
                    const val_prev= this[n];
                    this.attributeChangedCallback(name, val_prev, val_new);
                    return ( this[n]= val_new );
                }
            });
        }
        customElements.define(tag_name, CustomHTMLElement);
        return CustomHTMLElement;
        
        function configOnlyFunction(callback){
            return function(...params){
                if(!is_config_phase) throw new SyntaxError(`This function can be called only in root of "funConfig" function!`);
                return callback.call(this, ...params);
            };
        }
    };

    function globalStyle(styles){
        if(!el_style)
            el_style= document.head.appendChild(Object.assign(document.createElement("style"), { type: "text/css" }));
        el_style.appendChild(document.createTextNode(styles));
    }
    function attribute(target, name, { name_html, type= String, observed= true, initial }= {}){
        if(typeof name_html==="undefined")
            name_html= camelCaseToHyphens(name);
        target.push({ name, name_html, observed, type, initial });
    }
    
    function hyphensToCamelCase(text){ return text.replace(/-([a-z])/g, (_, l)=> l.toUpperCase()); }
    function camelCaseToHyphens(text){ return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(); }
})();
