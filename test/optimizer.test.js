import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

//----------------------------------
// Preinitialize Test Cases
//----------------------------------
const x = core.variable("x", core.numberType, true);
const y = core.variable("y", core.numberType, true);
const z = core.variable("z", core.numberType, true);

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
  ["optimizes -0", core.binaryExpression("-", x, 0), x],
  ["optimizes 0+", core.binaryExpression("+", 0, x), x],
  ["optimizes +0", core.binaryExpression("+", x, 0), x],
  ["optimizes 0*", core.binaryExpression("*", 0, x), 0],
  ["optimizes *0", core.binaryExpression("*", x, 0), 0],
  ["optimizes 1*", core.binaryExpression("*", 1, x), x],
  ["optimizes *1", core.binaryExpression("*", x, 1), x],
  ["optimizes **0", core.binaryExpression("**", x, 0), 1],
  ["optimizes **1", core.binaryExpression("**", x, 1), x],
  ["optimizes **-1", core.binaryExpression("**", x, -1), 1/x],
  ["optimizes %", core.binaryExpression("%", 5, 10), 5],
  ["removes x=x from the beginning", core.program([core.assignmentStatement(x, x), core.printStatement(y)]), core.program([core.printStatement(y)])],
  ["removes x=x from the middle", core.program([core.printStatement(y), core.assignmentStatement(x, x), core.printStatement(z)]), core.program([core.printStatement(y), core.printStatement(z)])],
  ["removes x=x from the end", core.program([core.printStatement(y), core.printStatement(z), core.assignmentStatement(x, x)]), core.program([core.printStatement(y), core.printStatement(z)])],


];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});
