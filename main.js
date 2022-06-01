/* jshint esversion: 6,-W097, -W040, browser: true, expr: true, undef: true */
/* global $dom */

/**
 * Testing component `app-test`
 * @slot test - Test slot
 * @fires change - `{detail: count}`
 * */
const C= $dom.wc("app-test", function({ attribute, shadowRoot }){
    const { mode, head }= shadowRoot("open");

    /** Test cumulator */
    attribute("count", { initial: 1, type: Number });
    /** Test property without “html part” */
    attribute("test", { name_html: false, initial: "Test text" });

    const at_selector= mode!==false ? "" : ":host";
    head.appendStyle(` :host { display: block; }
            ${at_selector} b { color: green; }
            ${at_selector} .bold { font-weight: bold; color: purple; }`);

    return function testComponent({ count, test }){
        const click_event= $dom.componentListener("click", ()=> this.dispatchEvent(new CustomEvent("change", { detail: count })));
        
        const { add, component, share }= $dom.component("<>");
            component(paragraphComponent({ count }));
            add("i", null, -1).onupdate({ test }, ({ test })=> ({ textContent: test }));
            add("br", null, -1);
            add("slot", { name: "test", className: "bold" }, -1);
                add("span", { textContent: "Default slot" });
            add("br", null, -2);
            add("button", { textContent: "Click" }, -1).on(click_event);
        return share;
    };
    
    function paragraphComponent({ count }) {
        const count_text= $dom.componentListener("update", { count }, ({ count })=> ({ textContent: count }));
        
        const { add, share }= $dom.component("p", { textContent: "Example count: " });
            add("b", null, -1).on(count_text);
        return share;
    }
});
