import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
  {
    name: "assignment",
    source: `
      switcheroo x: youBetcha!
      handful y: 2!
      switcheroo isPositive: y >= 2!
      chitchat message: "Eat the rich!"!
      switcheroo notX: nah x!
      handful diff: y - 1!
      switcheroo isEq: y == diff!
      handful prod: y * diff!
      handful quotient: prod / 2!
      chitchat empty: ""!
    `,
    expected: dedent`
      let x_1 = true;
      let y_2 = 2;
      let isPositive_3 = (y_2 >= 2);
      let message_4 = "Eat the rich!";
      let notX_5 = !(x_1);
      let diff_6 = (y_2 - 1);
      let isEq_7 = (y_2 === diff_6);
      let prod_8 = (y_2 * diff_6);
      let quotient_9 = (prod_8 / 2);
      let empty_10 = "";
    `
  },
  {
    name: "print",
    source: `
      handful x: 2!
      switcheroo flag: youBetcha!
      letMeLearnYouSomething("Hello, world")!
      letMeLearnYouSomething(x % 2 == 0)!
      letMeLearnYouSomething("test" + "case")!
      letMeLearnYouSomething(123)!
      letMeLearnYouSomething(nah flag)!
    `,
    expected: dedent`
      let x_1 = 2;
      let flag_2 = true;
      console.log("Hello, world");
      console.log(((x_1 % 2) === 0));
      console.log(("test" + "case"));
      console.log(123);
      console.log(!(flag_2));
    `
  },
  {
    name: "function_def",
    source: `
      gitErDone isEven(handful x): switcheroo {
        betterGetGoin x % 2 == 0!
      }
      gitErDone timesTwo(handful x): handful {
        betterGetGoin x * 2!
      }
      gitErDone add(handful x, handful y): handful {
        betterGetGoin x + y!
      }
      gitErDone returnParameter(chitchat s): chitchat {
        betterGetGoin s!
      }
      gitErDone zero(): handful {
        betterGetGoin 0!
      }
      gitErDone doubleThree(): handful {
        betterGetGoin timesTwo(3)!
      }
      gitErDone returnIfTrue(handful x, switcheroo b): handful {
        ope b {
          betterGetGoin x!
        } welp {
          betterGetGoin 0!
        }
      }
      gitErDone printMessage(chitchat greeting): chitchat {
        letMeLearnYouSomething(greeting)!
        betterGetGoin greeting!
      }
      gitErDone flip(): switcheroo {
        betterGetGoin nah youBetcha!
      }
      gitErDone decrement(handful x): handful {
        betterGetGoin x - 1!
      }
      gitErDone timesFour(handful x): handful {
        betterGetGoin timesTwo(timesTwo(x))!
      }
      gitErDone printTwice(chitchat message): chitchat {
        printMessage(message)!
        betterGetGoin printMessage(message)!
      }
      gitErDone printFlipped(): handful {
        letMeLearnYouSomething(flip())!
        betterGetGoin 0!
      }
    `,
    expected: dedent`
      function isEven_1(x_2) {
        return ((x_2 % 2) === 0);
      }
      function timesTwo_3(x_4) {
        return (x_4 * 2);
      }
      function add_5(x_6, y_7) {
        return (x_6 + y_7);
      }
      function returnParameter_8(s_9) {
        return s_9;
      }
      function zero_10() {
        return 0;
      }
      function doubleThree_11() {
        return timesTwo_3(3);
      }
      function returnIfTrue_12(x_13, b_14) {
        if (b_14) {
          return x_13;
        } else {
          return 0;
        }
      }
      function printMessage_15(greeting_16) {
        console.log(greeting_16);
        return greeting_16;
      }
      function flip_17() {
        return !(true);
      }
      function decrement_18(x_19) {
        return (x_19 - 1);
      }
      function timesFour_20(x_21) {
        return timesTwo_3(timesTwo_3(x_21));
      }
      function printTwice_22(message_23) {
        printMessage_15(message_23);
        return printMessage_15(message_23);
      }
      function printFlipped_24() {
        console.log(flip_17());
        return 0;
      }
    `
  },
  {
    name: "if_stmts",
    source: `
      handful x: 100!
      switcheroo ready: youBetcha!
      ope ready {
        letMeLearnYouSomething("go!")!
      }
      ope x >= 0 {
        letMeLearnYouSomething("positive")!
      } welp {
        letMeLearnYouSomething("negative")!
      }
      ope x > 50 {
        letMeLearnYouSomething(2)!
      } welp ope x > 25 {
        letMeLearnYouSomething(1)!
      } welp {
        letMeLearnYouSomething(0)!
      }
    `,
    expected: dedent`
      let x_1 = 100;
      let ready_2 = true;
      if (ready_2) {
        console.log("go!");
      }
      if ((x_1 >= 0)) {
        console.log("positive");
      } else {
        console.log("negative");
      }
      if ((x_1 > 50)) {
        console.log(2);
      } else
      if ((x_1 > 25)) {
        console.log(1);
      } else {
        console.log(0);
      }
    `
  },
  {
    name: "for_loop",
    source: `
      tilTheCowsComeHome handful x: 0, x < 10, x: x + 1 {
        letMeLearnYouSomething(x)!
      }

      handful y: 0!
      tilTheCowsComeHome y: 5, y < 10, y: y + 1 {
        letMeLearnYouSomething(y)!
      }

      handful z: 5!
      tilTheCowsComeHome z, z < 10, z: z + 1 {
        letMeLearnYouSomething(z)!
      }
    `,
    expected: dedent`
      for (let x_1 = 0; (x_1 < 10); x_1 = (x_1 + 1)) {
        console.log(x_1);
      }

      let y_2 = 0;
      for (y_2 = 5; (y_2 < 10); y_2 = (y_2 + 1)) {
        console.log(y_2);
      }

      let z_3 = 5;
      for (z_3; (z_3 < 10); z_3 = (z_3 + 1)) {
        console.log(z_3);
      }
    `
  },
  {
    name: "while_loop",
    source: `
      handful x: 0!
      switcheroo done: youBetcha!
      handful inner: 0!
      holdMyBeer x < 10 {
        x: x + 1!
      }
      holdMyBeer done == nah youBetcha {
        holdMyBeer inner < 2 {
          inner: inner + 1!
        }
        letsBlowThisPopsicleStand!
      }
    `,
    expected: dedent`
      let x_1 = 0;
      let done_2 = true;
      let inner_3 = 0;
      while ((x_1 < 10)) {
        x_1 = (x_1 + 1);
      }
      while ((done_2 === !(true))) {
        while ((inner_3 < 2)) {
          inner_3 = (inner_3 + 1);
        }
        break;
      }
    `
  },
  {
    name: "class_def",
    source: `
      doohickey Rectangle {
        slapTogether(handful h, handful w) {
          handful height: h!
          handful width: w!
        }
      }
      Rectangle r: whipUp Rectangle(4.0, 8.0)!
      letMeLearnYouSomething(r.width)!
      r.width: 5!
      doohickey Point {
        slapTogether(handful xIn, handful yIn) {
          handful x: xIn!
          handful y: yIn!
        }
        gitErDone distance(): handful {
          betterGetGoin x * x + y * y!
        }
      }
    `,
    expected: dedent`
      class Rectangle_1 {
        constructor(h_2, w_3) {
          this.height_4 = h_2;
          this.width_5 = w_3;
        }
      }
      let r_6 = new Rectangle(4, 8);
      console.log(r_6.width_5);
      r_6.width_5 = 5;
      class Point_7 {
        constructor(xIn_8, yIn_9) {
          this.x_10 = xIn_8;
          this.y_11 = yIn_9;
        }
        distance_12() {
          return ((this.x_10 * this.x_10) + (this.y_11 * this.y_11));
        }
      }
    `
  },
  {
    name: "data_structs",
    source: `
      todo fruits: ["apple", "banana"]!
      letMeLearnYouSomething(#fruits)!
      almanac fruitPrices: { "apple": 2, "banana": 1 }!
      todo nums: [1,2,3,4]!
      almanac dict: { "one": 1, "two": 2 }!
      todo combo: [nums, dict]!
    `,
    expected: dedent`
      let fruits_1 = ["apple", "banana"];
      console.log(fruits_1.length);
      let fruitPrices_2 = {"apple": 2, "banana": 1};
      let nums_3 = [1, 2, 3, 4];
      let dict_4 = {"one": 1, "two": 2};
      let combo_5 = [nums_3, dict_4];
    `
  },
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))))
      assert.deepEqual(actual, fixture.expected)
    })
  }
})
