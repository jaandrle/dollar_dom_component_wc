/* jshint esversion: 6,-W097, -W040, node: true, expr: true, undef: true */
import { readFileSync, writeFileSync, existsSync } from "fs";

const version= "2022-06-01";
if(process.argv.find(v=> v==="--version"||v==="-v")){
    console.log(version);
    process.exit(0);
}
if(process.argv.find(v=> v==="--help"||v==="-h")){
    const script= process.argv[1];
    console.log(`
    Generates \`*.d.ts\` files for Custom Elements defined with \`$dom.wc\`.
    The \`*.d.ts\` files can by used to generate docs & vscode compatibe
    json files using web-components-analyzer (see https://github.com/runem/web-component-analyzer).
    
    Usage: node ${script.slice(script.lastIndexOf("/")+1)} <src file> <target file>

        <target file> is by default <src file> with \`*.d.ts\` extension
    `);
    process.exit(0);
}

const src_path= process.argv[2];
if(!src_path||src_path.indexOf("*")!==-1||!existsSync(src_path)){
    console.log(`
    File path not specified or targeted multiple (glob) files or not exists!
    Use "--help"/"-h" for another information.
    `);
    process.exit(1);
}
const target_path= process.argv[3] || src_path.replace(".js", ".d.ts");

const components= Array.from(readFileSync(src_path).toString()
    .matchAll(/(\/\*\*\s*(?<comment>(?:(\s|\S)(?!(?:\* )?\*\/))+)\s+(\* )?\*\/\s)?.*\$dom\.defineElement\(.(?<tag_name>[^\"\']+)(?<define>(?:(\s|\S)(?<!return function))+)return function/g))
    .map(function({ groups: { tag_name, define, comment= "" } }){
        const out= { tag_name, comment };
        out.props= Array.from(define.matchAll(/(\/\*\* (?<comment>.*) \*\/\n\s*)?(?<attribute_parse>attribute\([^;]+\);)/g))
            .map(function({ groups: { attribute_parse, comment= "" } }){
                const attr= /* jshint -W061 */eval(attribute_parse);/* jshint +W061 */
                attr.comment= comment;
                return attr;
            });
        out.attrs= out.props.filter(({ name_html })=> name_html!==false)
            .map(function({ name_html, initial, type, comment= "" }){
                const name= typeof initial!=="undefined" ? `[${name_html}=${initial}]` : name_html;
                return ` * @attr {${type}} ${name} ${comment}`;
            });
        out.css_vars= Array.from(define.matchAll(/head\.cssVariables\((?<vars>[^\}]+\})(,\s*)?(?<args>[^\)]+)?\)/g))
            .flatMap(function({ groups: { vars, args } }){
                const is_scoped= /* jshint -W061 */eval(args);/* jshint +W061 */
                const vars_full= JSON.parse(vars.replace(/(\/\*\* (?<comment>.*) \*\/\n?)?\s*(?<name>[^:\/]+): +(?<initial>[^}\n]*(?<!,| +))(?<colon>,)?/g, cssVarsToJSON));
                return Object.entries(vars_full).map(function([ name, [ initial, comment ] ]){
                    const initial_str= initial ? "="+initial : "";
                    return ` * @cssprop [--${is_scoped?tag_name+"-":""}${name}${initial_str}] - ${comment}`;
                });
            });
        return out;

        function cssVarsToJSON(...a){
            const { comment= "", name, initial, colon= "" }= a.pop();
            const description= comment.replace(/"/g, '\\"');
            return `"${name}": [ ${initial}, "${description}" ]${colon}`;
        }
    })
    .reduce(function(acc, { tag_name, comment, props, attrs, css_vars }){
        const name_class= hyphensToCamelCase("HTML-"+tag_name+"Element");
        const comment_arr= comment.trim().split("\n").filter(curr=> curr.indexOf(`@type {${name_class}}`)===-1);
        const events= comment_arr.filter(l=> l.indexOf("@fires")!==-1).reduce((acc, curr)=> acc+(acc?"|":"")+`"${curr.match(/@fires (\S+)/)[1]}"`, "") || "string";
        const props_str= props.map(({ name_js, initial, type, comment })=> [
            `    /** ${comment} */`,
            `    ${name_js}: ${type}${typeof initial!=="undefined" ? "= "+attributeInitial(initial) : ""}`
        ].join("\n"));
        return acc + [
            `interface ${name_class}_props{`,
                props_str.join("\n"),
            "}",
            "/**",
                comment_arr.join("\n"),
                " * @element "+tag_name,
                attrs.join("\n"),
                css_vars.join("\n"),
            " * */",
            `interface ${name_class} extends ${name_class}_props, HTMLElement{`,
            `    new(options: ${name_class}_props): ${name_class}`,
            "    dispatchEvent(event: Event): boolean;",
            "    dispatchEvent(event: "+events+", params: CustomEventInit): boolean",
            "}",
            `declare var ${name_class}: { prototype: ${name_class}, new(options: ${name_class}_props): ${name_class} };`,
            "interface $domCustomElementRegistry{",
            `    "${tag_name}": {`,
            `        funConfig(this: ${name_class}, options: ${name_class}_props): $dom.component_main`,
            `        returns: ${name_class}`,
            "    }",
            "}"
        ].join("\n");
    }, "") + `\ninterface Document{ createElement<K extends keyof $domCustomElementRegistry>(tagName: K, options?: ElementCreationOptions): $domCustomElementRegistry[K]["returns"]; }`;

writeFileSync(target_path, components);

function attributeInitial(initial){
    const t= typeof initial;
    if(t==="undefined") return initial;
    if(t!=="string") return String(initial);

    initial= initial.replace(/"/g, '\\"');
    return `"${initial}"`;
}
function attribute(name_js, { initial, name_html, type= String, observed= true }= {}){
    if(name_html!==false)
        name_html= name_html || camelCaseToHyphens(name_js);
    return { name_js, name_html, initial, type: type.name.toLowerCase(), observed };
}
function camelCaseToHyphens(text){ return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(); }
function hyphensToCamelCase(text){ return text.replace(/-([a-z])/g, (_, l)=> l.toUpperCase()); }
