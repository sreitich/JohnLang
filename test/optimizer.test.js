import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

//----------------------------------
// Preinitialize Test Cases
//----------------------------------
const x = core.variable("x", core.numberType, true);
const negate = (x) => core.unaryExpression("-", x);
//----------------------------------
// Tests
//----------------------------------

const tests = [
  ["folds +", core.binaryExpression("+", 10, 5), 15],
  ["folds -", core.binaryExpression("-", 10, 5), 5],
  ["folds *", core.binaryExpression("*", 10, 5), 50],
  ["folds /", core.binaryExpression("/", 10, 5), 2],
  ["folds **", core.binaryExpression("**", 5, 10), 9765625],
  ["folds %", core.binaryExpression("%", 5, 10), 5],
  ["folds <", core.binaryExpression("<", 5, 10), true],
  ["folds <=", core.binaryExpression("<=", 5, 10), true],
  ["folds ==", core.binaryExpression("==", 5, 10), false],
  ["folds !=", core.binaryExpression("!=", 5, 10), true],
  ["folds >=", core.binaryExpression(">=", 5, 10), false],
  ["folds >", core.binaryExpression(">", 5, 10), false],
  ["optimizes 0-", core.binaryExpression("-", 0, x), negate(x)],
  ["optimizes +0", core.binaryExpression("+", 0, x), x],
  ["optimizes -0", core.binaryExpression("-", x, 0), x],
  ["optimizes *0", core.binaryExpression("*", x, 0), 0],
];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});
