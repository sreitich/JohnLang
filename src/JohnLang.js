import * as ohm from "ohm-js"
import * as fs from "fs"
import parse from "./parser.js";
import interpret from "./interpreter.js";

// Check usage.
if (process.argv.length !== 3) {
    console.error("Usage: node src/JohnLang.js FILENAME");
    process.exit(1);
}

try {
    const match = parse(process.argv[2]);
    interpret(match);
} catch (e) {
    console.error(e);
    process.exit(1);
}
