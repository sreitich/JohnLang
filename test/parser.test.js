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
                handful radius: r!
            }
            
            gitErDone diameter(): handful {
                betterGetGoin radius * 2!
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
        welp ope thinkAgainPal {
            letMeLearnYouSomething(1)!
        }
        welp {
            letMeLearnYouSomething(1)!
        }
    `],

    ["Long else if statement", `
        ope youBetcha {
            letMeLearnYouSomething(1)!
        }
        welp ope thinkAgainPal {
            letMeLearnYouSomething(1)!
        }
        welp ope thinkAgainPal {
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

    ["For loop with pre-declared iterator", `
        tilTheCowsComeHome x, x < 10, x: x + 1 {
            letMeLearnYouSomething(x)!
        }
    `],

    ["For loop with re-assigned iterator", `
        tilTheCowsComeHome x: 5, x < 10, x: x + 1 {
            letMeLearnYouSomething(x)!
        }
    `],

    ["For each loop", `
        tilTheCowsComeHome handful x: 0, x < #a, x: x + 1 {
            letMeLearnYouSomething(x)!
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

    /**
     * NOTE: Currently, JohnLang allows JavaScript-like mixing of ands and ors. If we decide
     * to change this feature, the third line of this test case must be changed.
     */
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

    ["size", `
        letMeLearnYouSomething(#[1,2,3])!
        letMeLearnYouSomething(#{1: 2, 3: 4})!
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

    ["Using members inside and outside classes", `
        NumberKeeper keeper: whipUp NumberKeeper(0)!
        keeper.addOne()!
    `],

    ["Error handling", `
        whenPigsFly(thinkAgainPal)!
        whoopsieDaisy "this is an error"!
    `],
]

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
    ["Non-letter in an identifier",
        "handful ab😭c: 2!",
            /Line 1, col 11:/],

    ["Bad number formatting",
        "handful x: 2.!",
            /Line 1, col 14:/],

    ["A float with an E but no exponent",
        "handful x: 5E * 11!",
            /Line 1, col 13:/],

    ["A missing right operand",
        "letMeLearnYouSomething(5 -)!",
            /Line 1, col 27:/],

    ["A non-operator",
        "letMeLearnYouSomething(7 * ((2 _ 3))!",
            /Line 1, col 32:/],

    ["An expression starting with an open parenthesis",
        "betterGetGoin )!",
            /Line 1, col 15:/],

    ["A statement starting with expression",
        "x * 5!",
            /Line 1, col 3:/],

    ["An illegal statement on line 2",
        "letMeLearnYouSomething(5)!\n" +
        "x * 5!",
            /Line 2, col 3:/],

    ["A statement missing an ending exclamation point",
        "letMeLearnYouSomething(5)",
        /Line 1, col 26:/],

    ["A statement following a statement with a missing ending exclamation point",
        "letMeLearnYouSomething(5)\n" +
        "letMeLearnYouSomething(3)!",
        /Line 2, col 1:/],

    ["A statement starting with an open parenthesis",
        "letMeLearnYouSomething(5)!\n" +
        ")",
            /Line 2, col 1:/],

    ["An expression starting with an asterisk",
        "handful x: * 71!",
            /Line 1, col 12:/],

    ["Negation before exponentiation",
        "letMeLearnYouSomething(-2**2)!",
            /Line 1, col 27:/],

    ["Associating relational operators",
        "letMeLearnYouSomething(1 < 2 < 3)!",
            /Line 1, col 30:/],

    ["While without braces",
        "holdMyBeer youBetcha\n" +
        "letMeLearnYouSomething(1)!",
            /Line 2, col 1/],

    ["Uninitialized for-loop iterator", `
        tilTheCowsComeHome handful x, x < 10, x: x + 1 {
            letMeLearnYouSomething(x)!
        }
    `],

    ["If without braces",
        "ope x < 3\n" +
        "letMeLearnYouSomething(1)!",
            /Line 2, col 1/],

    ["For as identifier",
        "handful tilTheCowsComeHome: 3!",
            /Line 1, col 9/],

    ["If as identifier",
        "handful ope: 8!",
            /Line 1, col 9/],

    ["Class without constructor",
        "doohickey Circle {\n" +
        "   gitErDone diameter(): handful {\n" +
        "       betterGetGoin 1!\n" +
        "   }\n"+
        "}",
            /Line 2, col 4/],

    ["Class with constructor with return type",
        "doohickey Circle {\n" +
        "   slapTogether(handful r): handful {\n" +
        "       handful radius: r!\n" +
        "   }\n" +
        "}",
        /Line 2, col 27/],

    ["Class with code outside of methods",
        "doohickey Circle {\n" +
        "   slapTogether(handful r) {\n" +
        "       handful radius: r!\n" +
        "   }\n" +
        "   handful diameter: radius * 2!" +
        "}",
            /Line 5, col 4/],

    ["Unbalanced brackets",
        "todo a: [1!",
            /Line 1, col 11/],

    ["Bad array literal",
        "letMeLearnYouSomething([1,2,])!",
            /Line 1, col 29/],

    ["Bad map literal",
        "letMeLearnYouSomething({a: 1, b:})!",
            /Line 1, col 33/],

    ["Empty subscript",
        "letMeLearnYouSomething(a[])!",
            /Line 1, col 26/],

    ["Assigning to bool literal",
        "youBetcha: 1!",
            /Line 1, col 10/],

    ["Assigning to num literal",
        "1: 2!",
            /Line 1, col 2/],

    ["Calling number literals",
        "letMeLearnYouSomething(500(x))!",
            /Line 1, col 27/],

    ["Calling string literals",
        "letMeLearnYouSomething(\"hello\"(x))!",
        /Line 1, col 31/],

    ["Accessing members in number literals",
        "letMeLearnYouSomething(500.0.x);",
            /Line 1, col 29/],

    ["String literal with unknown escape",
        'letMeLearnYouSomething("ab\\zcdef")!',
            /Line 1, col 28/],

    ["String literal with code point too long",
        'letMeLearnYouSomething("\\u{1111111}")!',
            /Line 1, col 34/],

    ["Assert without an expression", `
        whenPigsFly()!
    `],

    ["Throw without a message", `
        whoopsieDaisy!
    `],
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

