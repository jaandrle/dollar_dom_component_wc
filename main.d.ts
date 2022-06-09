/**
* Testing component `app-test`
 * @slot test - Test slot
 * @fires change - `{detail: count}`
 *
 * @element app-test
 * @attr {number} [count=1] Test cumulator attribute and property
 * @cssprop [--color=purple] - Testing custom CSS prop
 * */
class HTMLAppTestElement extends HTMLElement{
    /** Test cumulator attribute and property */
    count: number= 1
    /** Test property without “html part” */
    testText: string= "Test text"
    dispatchEvent(event: Event): boolean;
    dispatchEvent(event: "change", params: CustomEventInit): boolean
}
/** This function is called in `connectedCallback` lifecycle event of {@link HTMLAppTestElement} */
interface HTMLAppTestElement_connected{
(this: HTMLAppTestElement, {
    /** Test cumulator attribute and property */
    count: number= 1,
    /** Test property without “html part” */
    testText: string= "Test text"
}): $dom.component_main
}