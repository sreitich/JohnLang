import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import { program, variableDeclaration, variable, } from "../src/core.js"

// Programs expected to be semantically correct.
const semanticChecks = [
    ["variable declarations", 'handful x: 1! chitchat y: "false"!'],

    ["array types", "todo x: [1, 2]!"],

    ["initializing with empty array", "todo a: []!"],

    ["class declarations", "doohickey Square { slapTogether(handful l) { handful me.length: l! } }"],

    ["assigning arrays", "todo a: []! let b: [1]! a: b! b: a!"],

    ["assigning to array elements", "todo a: [1, 2, 3]! a[1]: 100!"],

    ["initializing with empty map", "almanac a: {}!"],

    ["assigning maps", "almanac a: {}! almanac b: {1: 2}! a: b! b: a!"],

    ["assigning to map elements", "almanac a: {1: 2, 4: 8}! a[1]: 4!"],

    ["return", "gitErDone f(): handful { betterGetGoin 0! }"],

    ["return in nested if", "gitErDone f(): handful { welp youBetcha { betterGetGoin 0! } }"],

    ["break in nested if", "holdMyBeer youBetcha { welp youBetcha { letsBlowThisPopsicleStand! } }"],

    ["long if", "welp youBetcha { letMeLearnYouSomething(1)! } ope { letMeLearnYouSomething(3)! }"],

    ["else if", "welp youBetcha { letMeLearnYouSomething(1)! } ope welp youBetcha { letMeLearnYouSomething(0)! } welp { letMeLearnYouSomething(3)! }"],

    ["for loop", "tilTheCowsComeHome handful x = 0, x < 10, x++ { letMeLearnYouSomething(0)! }"],

    ["||", "letMeLearnYouSomething(youBetcha || 1 < 2 || thinkAgainPal || nah youBetcha)!"],

    ["&&", "letMeLearnYouSomething(youBetcha && 1 < 2 && thinkAgainPal && nah youBetcha)!"],

    ["relations", 'letMeLearnYouSomething(1 <= 2 && "x" > "y" && 3.5 < 1.2)!'],

    ["ok to == arrays", "letMeLearnYouSomething([1] == [5,8])!"],

    ["ok to != arrays", "letMeLearnYouSomething([1] != [5,8])!"],

    ["ok to == maps", "letMeLearnYouSomething({1: 2} == {1: 2, 2: 4})!"],

    ["ok to != maps", "letMeLearnYouSomething({1: 2} != {1: 2, 2: 4})!"],

    ["arithmetic", "handful x: 1! letMeLearnYouSomething(2 * 3 + 5 ** -3 / 2 - 5 % 8)!"],

    ["variables", "todo x: [[[[1]]]]! letMeLearnYouSomething(x[0][0][0][0] + 2)!"],

    ["pseudo recursive class", "doohickey Rectangle { slapTogether(Rectangle r) { Rectangle me.rect: r! } }"],

    ["nested classes", "doohickey T { slapTogether(handful num) { handful me.number: num! } } doohickey S { slapTogether(T myClass) { T me.class: myClass! } } S x: S(T(1))! letMeLearnYouSomething(x.class.number)!"],

    ["member exp", "doohickey T { slapTogether(handful num) { handful me.number: num! } } T x: T(1)! letMeLearnYouSomething(x.number)!"],

    ["subscript exp", "todo a: [1,2]! letMeLearnYouSomething(a[0])!"],

    ["array of struct", "doohickey T { slapTogether() {} } todo x: [T(), T()]!"],

    ["class of arrays and maps", "doohickey S { slapTogether() { todo me.x: []! almanac me.y: {} } }"],

    [
        "function return types",
        `gitErDone square(handful x): handful { betterGetGoin x * x! }
         gitErDone flip(switcheroo y): switcheroo { betterGetGoin nah y! }`,
    ],

    ["array parameters", "gitErDone f(todo x): handful { betterGetGoin 0! }"],

    ["outer variable", "handful x: 1! holdMyBeer(thinkAgainPal) { letMeLearnYouSomething(x)! }"],
]

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
    // ["non-distinct fields", "struct S {x: boolean x: int}", /Fields must be distinct/],
    // ["non-int increment", "let x=false;x++;", /an integer/],
    // ["non-int decrement", 'let x=some[""];x++;', /an integer/],
    // ["undeclared id", "print(x);", /Identifier x not declared/],
    // ["redeclared id", "let x = 1;let x = 1;", /Identifier x already declared/],
    // ["recursive struct", "struct S { x: int y: S }", /must not be self-containing/],
    // ["assign to const", "const x = 1;x = 2;", /Cannot assign to immutable/],
    // [
    //     "assign to function",
    //     "function f() {} function g() {} f = g;",
    //     /Cannot assign to immutable/,
    // ],
    // ["assign to struct", "struct S{} S = 2;", /Cannot assign to immutable/],
    // [
    //     "assign to const array element",
    //     "const a = [1];a[0] = 2;",
    //     /Cannot assign to immutable/,
    // ],
    // [
    //     "assign to const optional",
    //     "const x = no int;x = some 1;",
    //     /Cannot assign to immutable/,
    // ],
    // [
    //     "assign to const field",
    //     "struct S {x: int} const s = S(1);s.x = 2;",
    //     /Cannot assign to immutable/,
    // ],
    // ["assign bad type", "let x=1;x=true;", /Cannot assign a boolean to a int/],
    // ["assign bad array type", "let x=1;x=[true];", /Cannot assign a \[boolean\] to a int/],
    // ["assign bad optional type", "let x=1;x=some 2;", /Cannot assign a int\? to a int/],
    // ["break outside loop", "break;", /Break can only appear in a loop/],
    // [
    //     "break inside function",
    //     "while true {function f() {break;}}",
    //     /Break can only appear in a loop/,
    // ],
    // ["return outside function", "return;", /Return can only appear in a function/],
    // [
    //     "return value from void function",
    //     "function f() {return 1;}",
    //     /Cannot return a value/,
    // ],
    // ["return nothing from non-void", "function f(): int {return;}", /should be returned/],
    // ["return type mismatch", "function f(): int {return false;}", /boolean to a int/],
    // ["non-boolean short if test", "if 1 {}", /Expected a boolean/],
    // ["non-boolean if test", "if 1 {} else {}", /Expected a boolean/],
    // ["non-boolean while test", "while 1 {}", /Expected a boolean/],
    // ["non-integer repeat", 'repeat "1" {}', /Expected an integer/],
    // ["non-integer low range", "for i in true...2 {}", /Expected an integer/],
    // ["non-integer high range", "for i in 1..<no int {}", /Expected an integer/],
    // ["non-array in for", "for i in 100 {}", /Expected an array/],
    // ["non-boolean conditional test", "print(1?2:3);", /Expected a boolean/],
    // ["diff types in conditional arms", "print(true?1:true);", /not have the same type/],
    // ["unwrap non-optional", "print(1??2);", /Expected an optional/],
    // ["bad types for ||", "print(false||1);", /Expected a boolean/],
    // ["bad types for &&", "print(false&&1);", /Expected a boolean/],
    // ["bad types for ==", "print(false==1);", /Operands do not have the same type/],
    // ["bad types for !=", "print(false==1);", /Operands do not have the same type/],
    // ["bad types for +", "print(false+1);", /Expected a number or string/],
    // ["bad types for -", "print(false-1);", /Expected a number/],
    // ["bad types for *", "print(false*1);", /Expected a number/],
    // ["bad types for /", "print(false/1);", /Expected a number/],
    // ["bad types for **", "print(false**1);", /Expected a number/],
    // ["bad types for <", "print(false<1);", /Expected a number or string/],
    // ["bad types for <=", "print(false<=1);", /Expected a number or string/],
    // ["bad types for >", "print(false>1);", /Expected a number or string/],
    // ["bad types for >=", "print(false>=1);", /Expected a number or string/],
    // ["bad types for ==", "print(2==2.0);", /not have the same type/],
    // ["bad types for !=", "print(false!=1);", /not have the same type/],
    // ["bad types for negation", "print(-true);", /Expected a number/],
    // ["bad types for length", "print(#false);", /Expected an array/],
    // ["bad types for not", 'print(!"hello");', /Expected a boolean/],
    // ["bad types for random", "print(random 3);", /Expected an array/],
    // ["non-integer index", "let a=[1];print(a[false]);", /Expected an integer/],
    // ["no such field", "struct S{} let x=S(); print(x.y);", /No such field/],
    // ["diff type array elements", "print([3,3.0]);", /Not all elements have the same type/],
    // ["shadowing", "let x = 1;\nwhile true {let x = 1;}", /Identifier x already declared/],
    // ["call of uncallable", "let x = 1;\nprint(x());", /Call of non-function/],
    // [
    //     "Too many args",
    //     "function f(x: int) {}\nf(1,2);",
    //     /1 argument\(s\) required but 2 passed/,
    // ],
    // [
    //     "Too few args",
    //     "function f(x: int) {}\nf();",
    //     /1 argument\(s\) required but 0 passed/,
    // ],
    // [
    //     "Parameter type mismatch",
    //     "function f(x: int) {}\nf(false);",
    //     /Cannot assign a boolean to a int/,
    // ],
    // [
    //     "function type mismatch",
    //     `function f(x: int, y: (boolean)->void): int { return 1; }
    //  function g(z: boolean): int { return 5; }
    //  f(2, g);`,
    //     /Cannot assign a \(boolean\)->int to a \(boolean\)->void/,
    // ],
    // ["bad param type in fn assign", "function f(x: int) {} function g(y: float) {} f = g;"],
    // [
    //     "bad return type in fn assign",
    //     `function f(x: int): int {return 1;}
    // function g(y: int): string {return "uh-oh";}
    // let h = f; h = g;`,
    //     /Cannot assign a \(int\)->string to a \(int\)->int/,
    // ],
    // ["type error call to sin()", "print(sin(true));", /Cannot assign a boolean to a float/],
    // [
    //     "type error call to sqrt()",
    //     "print(sqrt(true));",
    //     /Cannot assign a boolean to a float/,
    // ],
    // ["type error call to cos()", "print(cos(true));", /Cannot assign a boolean to a float/],
    // [
    //     "type error call to hypot()",
    //     'print(hypot("dog", 3.3));',
    //     /Cannot assign a string to a float/,
    // ],
    // [
    //     "too many arguments to hypot()",
    //     "print(hypot(1, 2, 3));",
    //     /2 argument\(s\) required but 3 passed/,
    // ],
    // ["Non-type in param", "let x=1;function f(y:x){}", /Type expected/],
    // ["Non-type in return type", "let x=1;function f():x{return 1;}", /Type expected/],
    // ["Non-type in field type", "let x=1;struct S {y:x}", /Type expected/],
]

describe("The analyzer", () => {
    for (const [scenario, source] of semanticChecks) {
        it(`recognizes ${scenario}`, () => {
            assert.ok(analyze(parse(source)))
        })
    }
    for (const [scenario, source, errorMessagePattern] of semanticErrors) {
        it(`throws on ${scenario}`, () => {
            assert.throws(() => analyze(parse(source)), errorMessagePattern)
        })
    }
    it("produces the expected representation for a trivial program", () => {
        assert.deepEqual(
            analyze(parse("let x = π + 2.2;")),
            program([
                variableDeclaration(
                    variable("x", true, floatType),
                    binary("+", variable("π", false, floatType), 2.2, floatType)
                ),
            ])
        )
    })
})