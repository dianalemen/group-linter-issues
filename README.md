# This script helps to group linter errors by their owners.

## In order to run script: 
- add a script in your `package.json` file `test:lint`. The script will execute the next: "./node_modules/.bin/eslint --max-warnings=0 -f ./lint-formatter.js 'path to ypur JavaScript files' > results.json"
- run `npx @linter-extension/group-issues`