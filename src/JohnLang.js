import * as ohm from "ohm-js"
import * as fs from "fs"
import parse from "./parser.js";
import translate from "./translator.js";

// Check usage.
if (process.argv.length !== 3) {
    console.error("Usage: node src/JohnLang.js FILENAME");
    process.exit(1);
}

try {
    const sourceCode = fs.readFileSync(process.argv[2], "utf8");
    const match = parse(sourceCode);
    const target = translate(match);
    console.log(target.join("\n"));
} catch (e) {
    console.error(e);
    process.exit(1);
}
