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
      switcheroo isEq: x == y!
      handful prod: x * diff!
      handful quotient: prod / 2!
      chitchat empty: ""!
    `,
    expected: dedent`
      let x = true;
      let y = 2;
      let isPositive = (y >= 2);
      let message = "Eat the rich";
      let notX = (!x);
      let diff = (y - 1);
      let isEq = (x == y);
      let prod = (x * diff);
      let quotient = (prod / 2);
      let empty = "";
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
      let x = 2;
      let flag = true;
      console.log("Hello, world");
      console.log((x % 2 == 0));
      console.log(("test" + "case"));
      console.log(123);
      console.log((!flag));
    `
  },
  {
    name: "function_def",
    source: `
      gitErDone isEven(handful x): switcheroo {
        betterGetGoin x % 2 == 0!
      }
      gitErDone f2(handful x): handful {
        betterGetGoin x * 2!
      }
      gitErDone f3(handful x, handful y): handful {
        betterGetGoin x + y!
      }
      gitErDone f4(chitchat s): chitchat {
        betterGetGoin s!
      }
      gitErDone f5(): handful {
        betterGetGoin 0!
      }
      gitErDone f6(): handful {
        betterGetGoin f2(3)!
      }
      gitErDone f7(handful x, switcheroo b): handful {
        ope b {
          betterGetGoin x!
        } welp {
          betterGetGoin 0!
        }
      }
      gitErDone f8(chitchat greeting): chitchat {
        letMeLearnYouSomething(greeting)!
        betterGetGoin greeting!
      }
      gitErDone f9(): switcheroo {
        betterGetGoin nah youBetcha!
      }
      gitErDone f10(handful x): handful {
        betterGetGoin x - 1!
      }
    `,
    expected: dedent`
      function isEven(x) {
        return x % 2 == 0;
      }
      function f2(x) {
        return (x * 2);
      }
      function f3(x, y) {
        return (x + y);
      }
      function f4(s) {
        return s;
      }
      function f5() {
        return 0;
      }
      function f6() {
        return f2(3);
      }
      function f7(x, b) {
        if (b) {
          return x;
        } else {
          return 0;
        }
      }
      function f8(greeting) {
        console.log(greeting);
        return greeting;
      }
      function f9() {
        return (!true);
      }
      function f10(x) {
        return (x - 1);
      }
    `
  },
  {
    name: "if_stmts",
    source: `
      handful x: 100!
      switcheroo ready: youBetcha!
      ope x > 50 {
        betterGetGoin 2!
      } welp ope x > 25 {
        betterGetGoin 1!
      } welp {
        betterGetGoin 0!
      }
      ope ready {
        betterGetGoin 100!
      }
    `,
    expected: dedent`
      let x = 100;
      let ready = true;
      if (x > 50) {
        return 2;
      } else if (x > 25) {
        return 1;
      } else {
        return 0;
      }
      if (ready) {
        return 100;
      }
    `
  },
  {
    name: "for_loop",
    source: `
      tilTheCowsComeHome handful x: 0, x < 10, x: x + 1 {
        letMeLearnYouSomething(x)!
      }
      tilTheCowsComeHome handful k: 5, k < 8, k: k + 1 {
        letMeLearnYouSomething(k)!
      }
    `,
    expected: dedent`
      for (var x = 0; x < 10; x++) {
        console.log(x);
      }
      for (var k = 5; k < 8; k++) {
        console.log(k);
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
      holdMyBeer done == nah true {
        holdMyBeer inner < 2 {
          inner: inner + 1!
        }
        break!
      }
    `,
    expected: dedent`
      let x = 0;
      let done = true;
      let inner = 0;
      while ((x < 10)) {
        x = (x + 1);
      }
      while ((done == (!true))) {
        while ((inner < 2)) {
          inner = (inner + 1);
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
          me.height: h!
          me.width: w!
        }
      }
      Rectangle r: whipUp Rectangle(4.0, 8.0)!
      letMeLearnYouSomething(r.width)!
      r.width: 5!
      doohickey Point {
        slapTogether(handful x, handful y) {
          me.x: x!
          me.y: y!
        }
        distance(): handful {
          betterGetGoin x * x + y * y!
        }
      }
    `,
    expected: dedent`
      class Rectangle {
        constructor(height, width) {
          this.height = height;
          this.width = width;
        }
      }
      let r = new Rectangle(4.0, 8.0);
      console.log(r.width);
      r.width = 5.0;
      class Point {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
        distance() {
          return ((x * x) + (y * y));
        }
      }
    `
  },
  {
    name: "data_structs",
    source: `
      todo fruits: ["apple", "banana"]!
      almanac fruitPrices: { "apple": 2, "banana": 1 }!
      todo nums: [1,2,3,4]!
      almanac dict: { "one": 1, "two": 2 }!
      todo combo: [nums, dict]!
    `,
    expected: dedent`
      let fruits = ["apple", "banana"];
      let fruitPrices = { "apple": 2, "banana": 1 };
      let nums = [1,2,3,4];
      let dict = { "one": 1, "two": 2 };
      let combo = [nums, dict];
    `
  },
  {
    name: "errors",
    source: `
      handful x: 1!
      whenPigsFly x > 0!
      whoopsieDaisy "Well, dontcha know, my muffler was actin' up the other day—musta been that darn weather, eh?—and my wife told me ta just go to a mechanic. But dontcha know, I told her, "Whoa, whoa, whoa. I can fix 'er!" Cause, ya know, all those mechanics will charge ya DOUBLE what it's gonna cost ya to fix it on yer own. And so I went down to the hardware store, but wouldn't ya know it, they were closed! So I turned around and went to my parents house (they don't get out much, eh? Ye know all this weather; they just weren't built for it, cause they moved up from down south in Florida, cause that's where my dad worked. Ya know, he moved there when he was forty years old, but by then the kids were outta the house and he and my mum had no problem setting down roots again. But they wanted to be closer to family after he retired so they came back up here to Wayzata, but, eh, wouldn't ya know it, they were used to all that warm weather down there in Florida!). And, just as luck would have it, my pops had a spare muffler in his garage (he was quite the handyman back in his day dontcha know), and he invited me in for a cawfee (you know we always take our cawfee black, eh), and we got to chit-chattin' about the kiddos, and it was real nice. But I had to get going, so I grabbed that muffler, drove on back home (the snow was comin' down like cats and dogs at that point), and fixed up ol' bessie's muffler in a jiffy."!
      whoopsieDaisy "oops"!
    `,
    expected: dedent`
      let x = 1;
      console.assert(x > 0);
      throw "Well, dontcha know, my muffler was actin' up the other day—musta been that darn weather, eh?—and my wife told me ta just go to a mechanic. But dontcha know, I told her, "Whoa, whoa, whoa. I can fix 'er!" Cause, ya know, all those mechanics will charge ya DOUBLE what it's gonna cost ya to fix it on yer own. And so I went down to the hardware store, but wouldn't ya know it, they were closed! So I turned around and went to my parents house (they don't get out much, eh? Ye know all this weather; they just weren't built for it, cause they moved up from down south in Florida, cause that's where my dad worked. Ya know, he moved there when he was forty years old, but by then the kids were outta the house and he and my mum had no problem setting down roots again. But they wanted to be closer to family after he retired so they came back up here to Wayzata, but, eh, wouldn't ya know it, they were used to all that warm weather down there in Florida!). And, just as luck would have it, my pops had a spare muffler in his garage (he was quite the handyman back in his day dontcha know), and he invited me in for a cawfee (you know we always take our cawfee black, eh), and we got to chit-chattin' about the kiddos, and it was real nice. But I had to get going, so I grabbed that muffler, drove on back home (the snow was comin' down like cats and dogs at that point), and fixed up ol' bessie's muffler in a jiffy.";
      throw "oops";
    `
  }
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))))
      assert.deepEqual(actual, fixture.expected)
    })
  }
})
