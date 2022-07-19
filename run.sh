#!/bin/bash
node ./dollar_dom_wc_cli.mjs main.js && npx -y web-component-analyzer main.d.ts --format ${1:-vscode} --outFile main.json
