import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"

// Programs expected to be syntactically correct.
const syntaxChecks = [
    ["Simplest syntactically correct program", `
        letsBlowThisPopsicleStand!
    `],

    ["Multiple statements", `
        letMeLearnYouSomething(1)!
        letsBlowThisPopsicleStand!
        handful x: 5!
        betterGetGoin 0!
        betterGetGoin 0!
    `],

    ["Variable declarations", `
        switcheroo z: false!
        handful e: 99*1!
        chitchat m: "howdy!"!
    `],

    ["List declarations", `
        todo a: [1, 2, 3]!
        todo b: ["one", "two"]!
    `],

    ["Map declarations", `
        almanac c: { "monday": 1, "tuesday": 2 }!
    `],

    ["Function with no parameters", `
        gitErDone returnZero(): handful {
            betterGetGoin 0!
        }
    `],

    ["Function with one parameter", `
        gitErDone returnGiven(switcheroo b): switcheroo {
            betterGetGoin b!
        }
    `],

    ["Function with two parameters", `
        gitErDone returnFirst(handful a, handful b): switcheroo {
            betterGetGoin a!
        }
    `],

    ["Function with list parameter", `
        gitErDone invertBool(todo b): switcheroo {
            betterGetGoin youBetcha!
        }
    `],

    ["Function returning a list", `
        gitErDone emptyList(): todo {
            betterGetGoin []!
        }
    `],

    ["Class declaration", `
        doohickey Circle {
            slapTogether(handful r) {
                handful me.radius: r!
            }
            
            gitErDone diameter(): handful {
                betterGetGoin me.radius * 2!
            }
        }
    `],

    ["Class object declaration", `
        Circle c: whipUp Circle(1.0)!
        letMeLearnYouSomething(c.radius)!
        letMeLearnYouSomething(c.diameter())!
        c.radius: 2.0!
    `],

    ["Assignments", `
        a: a + 1!
        b: b - 1!
        c: 9 * 3!
        d: "whoopsie daisy"!
    `],

    ["Advanced assignments", `
        numbers[0]: 100!
        days["monday"]: 2!
        fridge.fruits[1]: "apple"!
        shapes.rect.width: 2.0!
    `],

    ["Function calls in statements", `
        f(100)!
        letMeLearnYouSomething(1)!
    `],

    ["Function calls in expressions", `
        letMeLearnYouSomething(5 * f(x, y, 2 * y))!
    `],

    ["If statement", `
        ope youBetcha {
            letMeLearnYouSomething(1)!
        }
    `],

    ["Else statement", `
        ope youBetcha {
            letMeLearnYouSomething(1)!
        }
        welp {
            letMeLearnYouSomething(1)!
        }
    `],

    ["Else if statement", `
        ope youBetcha {
            letMeLearnYouSomething(1)!
        }
        ope welp thinkAgainPal {
            letMeLearnYouSomething(1)!
        }
        welp {
            letMeLearnYouSomething(1)!
        }
    `],

    ["Empty if statement", `
        ope youBetcha {
        }
    `],

    ["While statement", `
        holdMyBeer youBetcha {
            letMeLearnYouSomething(1)!
        }
    `],

    ["Empty while statement", `
        holdMyBeer youBetcha {
        }
    `],

    ["For loop", `
        tilTheCowsComeHome handful x: 0, x < 10, x: x + 1 {
            letMeLearnYouSomething(x)!
        }
    `],

    ["For loop with array", `
        tilTheCowsComeHome handful x: 0, x < a.len(), x: x + 1 {
            letMeLearnYouSomething(a[x])!
        }
    `],

    ["Boolean literals", `
        switcheroo x: true || false!
    `],

    ["Conditional operators", `
        letMeLearnYouSomething(youBetcha || thinkAgainPal)!
        letMeLearnYouSomething(youBetcha && youBetcha)!
        letMeLearnYouSomething(nah youBetcha || nah thinkAgainPal)!
    `],

    ["Conditional chaining", `
        letMeLearnYouSomething(a || b || c || d)!
        letMeLearnYouSomething(a && b && c && d)!
        letMeLearnYouSomething(a || (b && c) && (d || (e && f)))!
    `],

    ["Relational operators", `
        letMeLearnYouSomething(1 < 2)!
        letMeLearnYouSomething(1 <= 2)!
        letMeLearnYouSomething(1 > 2)!
        letMeLearnYouSomething(1 >= 2)!
        letMeLearnYouSomething(1 == 2)!
        letMeLearnYouSomething(1 != 2)!
    `],

    ["Numeric literal formats", `
        letMeLearnYouSomething(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5)!
    `],

    ["Arithmetic", `
        betterGetGoin 2 * x + 3 / 5 - -1 % 7 ** 3 ** 3!
    `],

    ["Empty array literal", `
        letMeLearnYouSomething([])!
    `],

    ["Indexing array literals", `
        betterGetGoin [1, 2, 3][0]!
    `],

    ["Non-empty array literal", `
        letMeLearnYouSomething([1, 2, 3])!
    `],

    ["Empty map literal", `
        letMeLearnYouSomething({})!
    `],

    ["Non-empty map literal", `
        letMeLearnYouSomething({1: "one", 2: "two", 3: "three"})!
    `],

    ["Parentheses", `
        letMeLearnYouSomething(83 * (((((-(13 / 21)))))) + 1 - 0)!
    `],

    ["Expression with variables", `
        betterGetGoin r.p(3,1)[9].x.y.z.p(5)[1]!
    `],

    ["Member expression on string literals", `
        letMeLearnYouSomething("Hello".append(", world!"))!
    `],

    ["Non-Latin letters in identifiers", `
        handful コンパイラ: 100!
    `],

    ["Non-Latin letters in strings", `
        letMeLearnYouSomething("😉😬💀🙅🏽‍♀️—")!
    `],

    ["Escape characters", `
        betterGetGoin "\\\\a\\n"!
        betterGetGoin "\\t"!
        betterGetGoin "\\"Hello\\""!
    `],

    ["Unicode escape", `
        letMeLearnYouSomething("\\u{a} \\u{2c} \\u{1e5} \\u{ae89} \\u{1f4a9} \\u{10ffe8}")!
    `],

    ["End of program inside comment", `
        letMeLearnYouSomething(0)! // yay
    `],

    ["Comments without text", `
        letMeLearnYouSomething(0)! //
        letMeLearnYouSomething(1)! //
    `],
]

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
    ["non-letter in an identifier", "let ab😭c = 2;", /Line 1, col 7:/],

    // TODO: Finish:
    // ["malformed number", "let x= 2.;", /Line 1, col 10:/],
    // ["a float with an E but no exponent", "let x = 5E * 11;", /Line 1, col 10:/],
    // ["a missing right operand", "print(5 -);", /Line 1, col 10:/],
    // ["a non-operator", "print(7 * ((2 _ 3));", /Line 1, col 15:/],
    // ["an expression starting with a )", "return );", /Line 1, col 8:/],
    // ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
    // ["an illegal statement on line 2", "print(5);\nx * 5;", /Line 2, col 3:/],
    // ["a statement starting with a )", "print(5);\n)", /Line 2, col 1:/],
    // ["an expression starting with a *", "let x = * 71;", /Line 1, col 9:/],
    // ["negation before exponentiation", "print(-2**2);", /Line 1, col 10:/],
    // ["mixing ands and ors", "print(1 && 2 || 3);", /Line 1, col 15:/],
    // ["mixing ors and ands", "print(1 || 2 && 3);", /Line 1, col 15:/],
    // ["associating relational operators", "print(1 < 2 < 3);", /Line 1, col 13:/],
    // ["while without braces", "while true\nprint(1);", /Line 2, col 1/],
    // ["if without braces", "if x < 3\nprint(1);", /Line 2, col 1/],
    // ["while as identifier", "let for = 3;", /Line 1, col 5/],
    // ["if as identifier", "let if = 8;", /Line 1, col 5/],
    // ["unbalanced brackets", "function f(): int[;", /Line 1, col 18/],
    // ["empty array without type", "print([]);", /Line 1, col 8/],
    // ["random used like a function", "print(random(1,2));", /Line 1, col 15/],
    // ["bad array literal", "print([1,2,]);", /Line 1, col 12/],
    // ["empty subscript", "print(a[]);", /Line 1, col 9/],
    // ["true is not assignable", "true = 1;", /Line 1, col 5/],
    // ["false is not assignable", "false = 1;", /Line 1, col 6/],
    // ["numbers cannot be subscripted", "print(500[x]);", /Line 1, col 10/],
    // ["numbers cannot be called", "print(500(x));", /Line 1, col 10/],
    // ["numbers cannot be dereferenced", "print(500 .x);", /Line 1, col 11/],
    // ["no-paren function type", "function f(g:int->int) {}", /Line 1, col 17/],
    // ["string lit with unknown escape", 'print("ab\\zcdef");', /col 11/],
    // ["string lit with newline", 'print("ab\\zcdef");', /col 11/],
    // ["string lit with quote", 'print("ab\\zcdef");', /col 11/],
    // ["string lit with code point too long", 'print("\\u{1111111}");', /col 17/],
]

describe("Parsing tests", () => {
    describe("Successfully parsing syntactically correct code", () => {
        for (const [scenario, source] of syntaxChecks) {
            it(`${scenario}`, () => {
                assert(parse(source).succeeded())
            })
        }
    })

    describe("Detecting syntax errors in syntactically incorrect code", () => {
        for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
            it(`${scenario}`, () => {
                assert.throws(() => parse(source), errorMessagePattern)
            })
        }
    })
})

