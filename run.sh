#!/bin/bash
node ./dollar_dom_wc_cli.mjs main.js && npx web-component-analyzer main.d.ts --format ${1:-vscode} --outFile main.json
