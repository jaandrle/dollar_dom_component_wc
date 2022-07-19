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
}
interface Document{ createElement<K extends keyof $domCustomElementRegistry>(tagName: K, options?: ElementCreationOptions): $domCustomElementRegistry[K]["returns"]; }