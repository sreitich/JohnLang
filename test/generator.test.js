import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

/*
const fixturesExample = [
  {
    name: "small",
    source: `
      let x = 3 * 7;
      x++;
      x--;
      let y = true;
      y = 5 ** -x / -100 > - x || false;
      print((y && y) || false || (x*2) != 5);
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "if",
    source: `
      let x = 0;
      if (x == 0) { print("1"); }
      if (x == 0) { print(1); } else { print(2); }
      if (x == 0) { print(1); } else if (x == 2) { print(3); }
      if (x == 0) { print(1); } else if (x == 2) { print(3); } else { print(4); }
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 === 0)) {
        console.log("1");
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else {
        console.log(2);
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        } else {
          console.log(4);
        }
    `,
  },
  {
    name: "while",
    source: `
      let x = 0;
      while x < 5 {
        let y = 0;
        while y < 5 {
          print(x * y);
          y = y + 1;
          break;
        }
        x = x + 1;
      }
    `,
    expected: dedent`
      let x_1 = 0;
      while ((x_1 < 5)) {
        let y_2 = 0;
        while ((y_2 < 5)) {
          console.log((x_1 * y_2));
          y_2 = (y_2 + 1);
          break;
        }
        x_1 = (x_1 + 1);
      }
    `,
  },
  {
    name: "functions",
    source: `
      let z = 0.5;
      function f(x: float, y: boolean) {
        print(sin(x) > π);
        return;
      }
      function g(): boolean {
        return false;
      }
      f(sqrt(z), g());
    `,
    expected: dedent`
      let z_1 = 0.5;
      function f_2(x_3, y_4) {
        console.log((Math.sin(x_3) > Math.PI));
        return;
      }
      function g_5() {
        return false;
      }
      f_2(Math.sqrt(z_1), g_5());
    `,
  },
  {
    name: "arrays",
    source: `
      let a = [true, false, true];
      let b = [10, #a - 20, 30];
      const c = [[int]]();
      const d = random b;
      print(a[1] || (b[0] < 88 ? false : true));
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,(a_1.length - 20),30];
      let c_3 = [];
      let d_4 = ((a=>a[~~(Math.random()*a.length)])(b_2));
      console.log((a_1[1] || (((b_2[0] < 88)) ? (false) : (true))));
    `,
  },
  {
    name: "structs",
    source: `
      struct S { x: int }
      let x = S(3);
      print(x.x);
    `,
    expected: dedent`
      class S_1 {
      constructor(x_2) {
      this["x_2"] = x_2;
      }
      }
      let x_3 = new S_1(3);
      console.log((x_3["x_2"]));
    `,
  },
  {
    name: "optionals",
    source: `
      let x = no int;
      let y = x ?? 2;
      struct S {x: int}
      let z = some S(1);
      let w = z?.x;
    `,
    expected: dedent`
      let x_1 = undefined;
      let y_2 = (x_1 ?? 2);
      class S_3 {
      constructor(x_4) {
      this["x_4"] = x_4;
      }
      }
      let z_5 = new S_3(1);
      let w_6 = (z_5?.["x_4"]);
    `,
  },
  {
    name: "for loops",
    source: `
      for i in 1..<50 {
        print(i);
      }
      for j in [10, 20, 30] {
        print(j);
      }
      repeat 3 {
        // hello
      }
      for k in 1...10 {
      }
    `,
    expected: dedent`
      for (let i_1 = 1; i_1 < 50; i_1++) {
        console.log(i_1);
      }
      for (let j_2 of [10,20,30]) {
        console.log(j_2);
      }
      for (let i_3 = 0; i_3 < 3; i_3++) {
      }
      for (let k_4 = 1; k_4 <= 10; k_4++) {
      }
    `,
  },
  {
    name: "standard library",
    source: `
      let x = 0.5;
      print(sin(x) - cos(x) + exp(x) * ln(x) / hypot(2.3, x));
      print(bytes("∞§¶•"));
      print(codepoints("💪🏽💪🏽🖖👩🏾💁🏽‍♀️"));
    `,
    expected: dedent`
      let x_1 = 0.5;
      console.log(((Math.sin(x_1) - Math.cos(x_1)) + ((Math.exp(x_1) * Math.log(x_1)) / Math.hypot(2.3,x_1))));
      console.log([...Buffer.from("∞§¶•", "utf8")]);
      console.log([...("💪🏽💪🏽🖖👩🏾💁🏽‍♀️")].map(s=>s.codePointAt(0)));
    `,
  },
]
*/

const fixtures = [
    {
        name: "assignment",
        source: `
            switcheroo x: youBetcha!
            handful y: 2!
            switcheroo isPositive: y >= 2!
            chitchat message: "Eat the rich!"!
        `,
        expected: dedent`
            let x = true;
            let y = 2;
            let isPositive = (y >= 0);
            let message = "Eat the rich";
        `
    },
    {
        name: "print",
        source: `
            letMeLearnyouSomething("Hello, world)!
        `,
        expected: dedent`
            console.log("Hello, world");
        `
    },
    {
        name: "function_def",
        source: `
            gitErDone isEven(handful x): switcheroo {
                betterGetGoin x % 2 == 0!
            }
        `,
        expected: dedent`
            function isEven(x) {
                return x % 2 == 0;
            }
        `
    },
    {
        name: "if_stmts",
        source: `
            ope x > 50 {
	            betterGetGoin 2!      
            } welp ope x > 25 {
	            betterGetGoin 1!
            } welp {
	            betterGetGoin 0!
            }
        `,
        expected: dedent`
            if (x > 50) {
	            return 2;
            } else if (x > 25) {      
	            return 1;
            } else {
	            return 0;
            }
        `
    },
    {
        name: "for_loop",
        source: `
            tilTheCowsComeHome handful x: 0, x < 10, x: x + 1 {      
	            letMeLearnYouSomething(x)!
            }
        `,
        expected: dedent`
            for (var x = 0; x < 10; x++) {      
	            console.log(x);
            }
        `
    },
    {
        name: "while_loop",
        source: `
            holdMyBeer x < 10 {      
	            x: x + 1!
            }
        `,
        expected: dedent`
            while (x < 10) {      
	            x++;
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
        `
    },
    {
        name: "data_structs",
        source: `
            todo fruits: ["apple", "banana"]!
            almanac fruitPrices: { "apple": 2, "banana": 1 }!
        `,
        expected: dedent`
            let fruits = ["apple", "banana"];
            let almanac = fruitPrices: { "apple": 2, "banana": 1 };   
        `
    },
    {
        name: "errors",
        source: `
            whoopsieDaisy "Well, dontcha know, my muffler was actin' up the other day—musta been that darn weather, eh?—and my wife told me ta just go to a mechanic. But dontcha know, I told her, "Whoa, whoa, whoa. I can fix 'er!" Cause, ya know, all those mechanics will charge ya DOUBLE what it's gonna cost ya to fix it on yer own. And so I went down to the hardware store, but wouldn't ya know it, they were closed! So I turned around and went to my parents house (they don't get out much, eh? Ye know all this weather; they just weren't built for it, cause they moved up from down south in Florida, cause that's where my dad worked. Ya know, he moved there when he was forty years old, but by then the kids were outta the house and he and my mum had no problem setting down roots again. But they wanted to be closer to family after he retired so they came back up here to Wayzata, but, eh, wouldn't ya know it, they were used to all that warm weather down there in Florida!). And, just as luck would have it, my pops had a spare muffler in his garage (he was quite the handyman back in his day dontcha know), and he invited me in for a cawfee (you know we always take our cawfee black, eh), and we got to chit-chattin' about the kiddos, and it was real nice. But I had to get going, so I grabbed that muffler, drove on back home (the snow was comin' down like cats and dogs at that point), and fixed up ol' bessie's muffler in a jiffy."!
        `,
        expected: dedent` 
            throw "Well, dontcha know, my muffler was actin' up the other day—musta been that darn weather, eh?—and my wife told me ta just go to a mechanic. But dontcha know, I told her, "Whoa, whoa, whoa. I can fix 'er!" Cause, ya know, all those mechanics will charge ya DOUBLE what it's gonna cost ya to fix it on yer own. And so I went down to the hardware store, but wouldn't ya know it, they were closed! So I turned around and went to my parents house (they don't get out much, eh? Ye know all this weather; they just weren't built for it, cause they moved up from down south in Florida, cause that's where my dad worked. Ya know, he moved there when he was forty years old, but by then the kids were outta the house and he and my mum had no problem setting down roots again. But they wanted to be closer to family after he retired so they came back up here to Wayzata, but, eh, wouldn't ya know it, they were used to all that warm weather down there in Florida!). And, just as luck would have it, my pops had a spare muffler in his garage (he was quite the handyman back in his day dontcha know), and he invited me in for a cawfee (you know we always take our cawfee black, eh), and we got to chit-chattin' about the kiddos, and it was real nice. But I had to get going, so I grabbed that muffler, drove on back home (the snow was comin' down like cats and dogs at that point), and fixed up ol' bessie's muffler in a jiffy.";
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