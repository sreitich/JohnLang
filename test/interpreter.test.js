import { describe, it } from "node:test";
import { ok, throws } from "node:assert/strict";
import parse from "../src/parser.js";

describe("Interpreter", () => {
    it("parses correctly", () => {
        ok(parse("letMeLearnYouSomething(1)!").succeeded());
    });
    it("throws on syntax errors", () => {
        throws(parse("letMeLearnYouSomething(1)"), /Expected/);
    });
});