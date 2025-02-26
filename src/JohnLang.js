import * as fs from "fs"
import stringify from "graph-stringify"
import compile from "./compiler.js"
import parse from "./parser.js";
import translate from "./translator.js";
import analyze from "./analyzer.js";

const help = `JohnLang compiler

Syntax: JohnLang.js <filename> <outputType>

Prints to stdout according to <outputType>, which must be one of:

  parsed     a message that the program was matched ok by the grammar
  analyzed   the statically analyzed representation
  optimized  the optimized semantically analyzed representation
  js         the translation to JavaScript
`

function compileFromFile(filename, outputType) {
    try {
        const sourceCode = fs.readFileSync(filename, "utf8")
        const compiled = compile(sourceCode.toString(), outputType)
        console.log(stringify(compiled, "kind") || compiled)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

if (process.argv.length !== 4) {
    console.log(help)
} else {
    compileFromFile(process.argv[2], process.argv[3])
}