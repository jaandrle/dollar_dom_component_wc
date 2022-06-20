interface HTMLAppTestElement_props{
    /** Test cumulator attribute and property */
    count: number= 1
    /** Test property without “html part” */
    testText: string= "Test text"
}
/**
* Testing component `app-test`
 * @slot test - Test slot
 * @fires change - `{detail: count}`
 * @element app-test
 * @attr {number} [count=1] Test cumulator attribute and property
 * @cssprop [--color=purple] - Testing custom CSS prop
 * */
interface HTMLAppTestElement extends HTMLAppTestElement_props, HTMLElement{
    new(options: HTMLAppTestElement_props): HTMLAppTestElement
    dispatchEvent(event: Event): boolean;
    dispatchEvent(event: "change", params: CustomEventInit): boolean
}
declare var HTMLAppTestElement: { prototype: HTMLAppTestElement, new(options: HTMLAppTestElement_props): HTMLAppTestElement };
interface $domCustomElementRegistry{
    "app-test": {
        funConfig(this: HTMLAppTestElement, options: HTMLAppTestElement_props): $dom.component_main
        returns: HTMLAppTestElement
    }
}interface HTMLAppPokusElement_props{
    /**  */
    numberNext: string
}
/**
* Další pokus
 * @element app-pokus
 * @attr {string} number-next 

 * */
interface HTMLAppPokusElement extends HTMLAppPokusElement_props, HTMLElement{
    new(options: HTMLAppPokusElement_props): HTMLAppPokusElement
    dispatchEvent(event: Event): boolean;
    dispatchEvent(event: string, params: CustomEventInit): boolean
}
declare var HTMLAppPokusElement: { prototype: HTMLAppPokusElement, new(options: HTMLAppPokusElement_props): HTMLAppPokusElement };
interface $domCustomElementRegistry{
    "app-pokus": {
        funConfig(this: HTMLAppPokusElement, options: HTMLAppPokusElement_props): $dom.component_main
        returns: HTMLAppPokusElement
    }
}
interface Document{ createElement<K extends keyof $domCustomElementRegistry>(tagName: K, options?: ElementCreationOptions): $domCustomElementRegistry[K]["returns"]; }