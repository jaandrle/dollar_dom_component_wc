/**
* Testing component `app-test`
 * @slot test - Test slot
 * @fires change - `{detail: count}`
 * @cssprop [--app-test-color=purple] - Test
 *
 * @element app-test
 * @attr {number} [count=1] Test cumulator attribute and property 
 * */
class HTMLAppTestElement extends HTMLElement{
    /** Test cumulator attribute and property  */
    count: number= 1
    /** Test property without “html part”  */
    testText: string= "Test text"
    dispatchEvent(event: Event): boolean;
    dispatchEvent(event: "change", params: CustomEventInit): boolean
}
interface HTMLAppTestElement_connected{
(this: HTMLAppTestElement, {
    /** Test cumulator attribute and property  */
    count: number= 1,
    /** Test property without “html part”  */
    testText: string= "Test text"
}): $dom.component_main
}