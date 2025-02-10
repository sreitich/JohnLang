import * as fs from "fs"
import * as ohm from "ohm-js"

const grammar = ohm.grammar(fs.readFileSync("./JohnLang.ohm", "utf8"));

export default function parse(sourceCode) {
    const match = grammar.match(sourceCode);
    if (match.failed())
    {
        throw match.message;
    }
    return match;
}