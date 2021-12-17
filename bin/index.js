#!/usr/bin/env node

const waitForWriting = require("../index");
const resultUrl = "../../../../results.json";
const codeOwnerPath = "../../../../.github/CODEOWNERS";

waitForWriting(resultUrl, codeOwnerPath).then(() => console.log("done"));
