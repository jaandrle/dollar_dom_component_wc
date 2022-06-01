/* jshint esversion: 6,-W097, -W040, node: true, expr: true, undef: true */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { spawnSync } from "child_process";

const id_debug= process.argv.indexOf("--debug");
if(id_debug!==-1) process.argv.splice(id_debug, 1);

const version= "2022-06-01";
const [ , script, file_path= "", ...wca_args ]= process.argv;
if(process.argv.find(v=> v==="--version"||v==="-v")){
    console.log("this script\n"+version);
    console.log("web-component-analyzer");
    wcaSync([ "--version" ]);
    process.exit(0);
}
if(process.argv.find(v=> v==="--help"||v==="-h")){
    console.log(`
    Usage: node ${script.slice(script.lastIndexOf("/")+1)} <command> [src file] [options]

    --debug: Keeps temp files for debugging purposes.

    All another commands/options are passed to web-components-analyzer (see https://github.com/runem/web-component-analyzer),
    which is used internally via 'npx web-components-analyzer'.

    (For now?), only one file is allowed as source ("src" above).
    `);
    wcaSync([ "help" ]);
    process.exit(0);
}
if(!file_path||file_path.indexOf("*")!==-1){
    console.log(`
    File path not specified or targeted multiple (glob) files!
    Use "--help"/"-h" for more information.
    `);
    process.exit(1);
}

const components= Array.from(readFileSync(file_path).toString()
    .matchAll(/(\/\*\*\s*(?<comment>(\s|\S)+)\s+(\* )?\*\/\s)?.*\$dom\.wc\(.(?<tag_name>[^\"\']+)(?<define>(\s|\S)+)return function/g))
    .map(function({ groups: { tag_name, define, comment= "" } }){
        const attributes= Array.from(define.matchAll(/(\/\*\*\s*(?<comment>.*)\s*(\*\s*)?\*\/\n\s*)?(?<attribute_parse>attribute\([^;]+\);)/g))
            .flatMap(function({ groups: { attribute_parse, comment= "" } }){
                const atts= /* jshint -W061 */eval(attribute_parse);/* jshint +W061 */
                return atts.map(text=> text+" "+comment);
            });
        return [ " "+comment.trim(), ` * @element ${tag_name}`, ...attributes ];
    })
    .reduce(function(acc, curr){
        return acc+`/**\n${curr.join("\n")}\n * */\nclass CustomHTMLElement extends HTMLElement{}`;
    }, "");

const tmp_path= file_path.replace(".js", `.tmp${Math.floor(Math.random()*100).toString().padStart(3, "0")}.js`);
writeFileSync(tmp_path, components);
wcaSync([ tmp_path, ...wca_args ]);
if(id_debug===-1){
    unlinkSync(tmp_path);
    process.exit(0);
}
console.log("Temp file is available here: "+tmp_path);

function attribute(name_js, { initial, type= String, name_html }){
    const out= [
        ` * @prop {${type.name.toLowerCase()}} ${typeof initial!==undefined ? "["+name_js+"="+initial+"]" : name_js }`,
    ];
    if(name_html!==false){
        name_html= name_html || camelCaseToHyphens(name_js);
        out.push(` * @attr {${type.name.toLowerCase()}} ${typeof initial!==undefined ? "["+name_html+"="+initial+"]" : name_html }`);
    }
    return out;
}
function camelCaseToHyphens(text){ return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(); }
function wcaSync(args, config= {}){
    const s= spawnSync("npx", [ "web-component-analyzer", ...args ], config);
    console.log(s.output.join("\n").replace("npm WARN exec The following package was not found and will be installed: web-component-analyzer\n", "").trim());
    if(s.error|s.status) process.exit(1);
}
