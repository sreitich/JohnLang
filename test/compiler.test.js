import { describe, it } from "node:test";
import { deepEqual } from "node:assert/strict";
import { add } from "../src/JohnLangauge.js";

describe("Compiler", () => {
    it("is alive", () => {
        deepEqual(add(1, 2), 3);
    });
});