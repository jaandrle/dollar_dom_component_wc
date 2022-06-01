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
    testTest: string= "Test text"
}