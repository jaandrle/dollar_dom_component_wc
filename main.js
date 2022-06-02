/* jshint esversion: 6,-W097, -W040, browser: true, expr: true, undef: true */
/* global $dom */

/**
 * Testing component `app-test`
 * @type {HTMLAppTestElement}
 * @slot test - Test slot
 * @fires change - `{detail: count}`
 * @cssprop [--app-test-color=purple] - Test
 * */
const C= $dom.wc("app-test", function({ attribute, shadowRoot, tag_name }){
    const { head }= shadowRoot("closed");

    /** Test cumulator attribute and property */
    attribute("count", { initial: 1, type: Number });
    /** Test property without “html part” */
    attribute("testText", { name_html: false, initial: "Test text" });

    const css_color= tag_name+"-color";
    head.appendStyle(`
        * { --local-${css_color}: var(--${css_color}, purple); }
        :host { display: block; }
        & b { color: green; }
        & .bold {
            font-weight: bold;
            color: var(--local-${css_color});
        }`,
    "&");
    /** @type {HTMLAppTestElement_connected} */
    return function testComponent({ count, testText }){
        const click_event= $dom.componentListener("click", ()=> this.dispatchEvent("change", { detail: count }));
        
        const { add, component, share }= $dom.component("<>");
            component(paragraphComponent({ count }));
            add("i", null, -1).onupdate({ testText }, ({ testText })=> ({ textContent: testText }));
            add("br", null, -1);
            add("slot", { name: "test", className: "bold" }, -1);
                add("span", { textContent: "Default slot" });
            add("br", null, -2);
            add("button", { textContent: "Click", part: "ahoj" }, -1).on(click_event);
        return share;
    };
    
    function paragraphComponent({ count }) {
        const count_text= $dom.componentListener("update", { count }, ({ count })=> ({ textContent: count }));
        
        const { add, share }= $dom.component("p", { textContent: "Example count: " });
            add("b", null, -1).on(count_text);
        return share;
    }
});
