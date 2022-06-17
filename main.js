/* jshint esversion: 6,-W097, -W040, browser: true, expr: true, undef: true */
/* global $dom */

/**
 * Testing component `app-test`
 * @type {HTMLAppTestElement}
 * @slot test - Test slot
 * @fires change - `{detail: count}`
 * */
const C= $dom.defineElement("app-test", function({ attribute, shadowRoot }){
    const { head }= shadowRoot("closed", { slots: "simulated" });

    const { color }= head.cssVariables({
        /** Testing custom CSS prop */ color: "purple"
    });
    head.appendStyle(`
        :host { display: block; }
        & b { color: green; }
        & .bold {
            font-weight: bold;
            color: ${color};
        }`,
    "&");

    /** Test cumulator attribute and property */
    attribute("count", { initial: 1, type: Number });
    /** Test property without “html part” */
    attribute("testText", { initial: "Test text", name_html: false });
    /** @type {HTMLAppTestElement_connected} */
    return function testComponent({ count, testText }){
        const click_event= $dom.componentListener("click", ({ target })=> {
            this.count+= Number(target.textContent);
            this.dispatchEvent("change", { detail: count });
        });
        
        const { add, component, share }= $dom.component("<>");
            component(paragraphComponent({ count }));
            add("i", null, -1).onupdate({ testText }, ({ testText })=> ({ textContent: testText }));
            add("br", null, -1);
            add("slot", { name: "test-slot", className: "bold" }, -1);
                add("span", { textContent: "Default slot" });
            add("br", null, -2);
            add("button", { textContent: "-1", part: "ahoj" }, -1).on(click_event);
            add("button", { textContent: "+1", part: "ahoj" }, -1).on(click_event);
        return share;
    };
    
    function paragraphComponent({ count }) {
        const count_text= $dom.componentListener("update", { count }, ({ count })=> ({ textContent: count }));
        
        const { add, share }= $dom.component("p", { textContent: "Example count: " });
            add("b", null, -1).on(count_text);
        return share;
    }
});

document.body.append(
    new C({ count: 24, ariaLabel: "Test" }),
    $dom.assign(document.createElement(C.tagName), { count: -24, ariaLabel: "Test" })
);
