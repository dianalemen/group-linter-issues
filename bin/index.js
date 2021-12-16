#!/usr/bin/env node

const waitForWriting = require('../index')

waitForWriting().then(() => console.log('done'))
