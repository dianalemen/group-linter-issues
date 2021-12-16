#!/usr/bin/env node

const waitForWriting = require('../index')
const resultUrl = require('../../../../results.json')
const codeOwnerPath = require('../../../../.github/CODEOWNERS')

waitForWriting(resultUrl, codeOwnerPath).then(() => console.log('done'))
