import { describe, it } from "node:test"
import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

//----------------------------------
// Preinitialize Test Cases
//----------------------------------


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
]

describe("The optimizer", () => {
    for (const [scenario, before, after] of tests) {
      it(`${scenario}`, () => {
        assert.deepEqual(optimize(before), after)
      })
    }
  })


