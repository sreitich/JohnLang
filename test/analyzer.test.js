import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import {program, variableDeclaration, variable, numberType, binaryExpression, } from "../src/core.js"
import * as messages from "../src/messages.js";

// Programs expected to be semantically correct.
const semanticChecks = [
    ["variable declarations", 'handful x: 1! chitchat y: "false"!'],

    ["array types", "todo x: [1, 2]!"],

    ["initializing with empty array", "todo a: []!"],

    ["class declarations",
        `doohickey Square {
            slapTogether(handful l) {
                handful length: l!
            }
        }`],

    ["assigning arrays", "todo a: []! todo b: [1]! a: b! b: a!"],

    ["assigning to array elements", "todo a: [1, 2, 3]! a[1]: 100!"],

    ["initializing with empty map", "almanac a: {}!"],

    ["assigning maps", "almanac a: {}! almanac b: {1: 2}! a: b! b: a!"],

    ["assigning to map elements", "almanac a: {1: 2, 4: 8}! a[1]: 4!"],

    ["size operator", "todo a: []! letMeLearnYouSomething(#a)!"],

    ["return", "gitErDone f(): handful { betterGetGoin 0! }"],

    ["return in nested if", "gitErDone f(): handful { ope youBetcha { betterGetGoin 0! } }"],

    ["break in nested if", "holdMyBeer youBetcha { ope youBetcha { letsBlowThisPopsicleStand! } }"],

    ["long if", "ope youBetcha { letMeLearnYouSomething(1)! } welp { letMeLearnYouSomething(3)! }"],

    ["else if", "ope youBetcha { letMeLearnYouSomething(1)! } welp ope youBetcha { letMeLearnYouSomething(0)! } welp { letMeLearnYouSomething(3)! }"],

    ["chaining else ifs", "ope youBetcha { letMeLearnYouSomething(1)! } welp ope youBetcha { letMeLearnYouSomething(0)! } welp ope youBetcha { letMeLearnYouSomething(0)! } welp { letMeLearnYouSomething(3)! }"],

    ["for loop", "tilTheCowsComeHome handful x: 0, x < 10, x: x + 1 { letMeLearnYouSomething(0)! }"],

    ["for each loop", "todo a: []! tilTheCowsComeHome handful x: 0, x < #a, x: x + 1 { letMeLearnYouSomething(0)! }"],

    ["||", "letMeLearnYouSomething(youBetcha || 1 < 2 || thinkAgainPal || nah youBetcha)!"],

    ["&&", "letMeLearnYouSomething(youBetcha && 1 < 2 && thinkAgainPal && nah youBetcha)!"],

    ["relations", 'letMeLearnYouSomething(1 <= 2 && 3.5 < 1.2)!'],

    ["ok to == arrays", "letMeLearnYouSomething([1] == [5,8])!"],

    ["ok to != arrays", "letMeLearnYouSomething([1] != [5,8])!"],

    ["ok to == maps", "letMeLearnYouSomething({1: 2} == {1: 2, 2: 4})!"],

    ["ok to != maps", "letMeLearnYouSomething({1: 2} != {1: 2, 2: 4})!"],

    ["append strings", `letMeLearnYouSomething("Hello" + ", world")!`],

    ["arithmetic", "handful x: 1! letMeLearnYouSomething(2 * 3 + 5 ** -3 / 2 - 5 % 8)!"],

    ["variables", "todo x: [[[[1]]]]! letMeLearnYouSomething(x[0][0][0][0] + 2)!"],

    ["pseudo recursive class", "doohickey Rectangle { slapTogether(Rectangle r) { Rectangle rect: r! } }"],

    ["member exp",
        `doohickey T {
            slapTogether(handful num) {
                handful number: num!
            }
        }
        T x: T(1)!
        letMeLearnYouSomething(x.number)!
    `],

    ["subscript array", "todo a: [1,2]! letMeLearnYouSomething(a[0])!"],

    ["subscript map", `almanac a: {"hello": 1}! letMeLearnYouSomething(a["hello"])!`],

    ["subscript assign array", "todo a: [1,2]! a[0]: 2!"],

    ["subscript assign map", `almanac a: {"hello": 1}! a["hello"]: 2!`],

    ["array of struct", "doohickey T { slapTogether() {} } todo x: [T(), T()]!"],

    ["class of arrays and maps", "doohickey S { slapTogether() { todo x: []! almanac y: {}! } }"],

    ["function return types", `gitErDone square(handful x): handful { betterGetGoin x * x! } gitErDone flip(switcheroo y): switcheroo { betterGetGoin nah y! }`],

    ["array parameters", "gitErDone f(todo x): handful { betterGetGoin 0! }"],

    ["outer variable", "handful x: 1! holdMyBeer(thinkAgainPal) { letMeLearnYouSomething(x)! }"],

    ["self-referencing field", "doohickey C { slapTogether(C c) { C c: c! } }"],

    ["object declaration",
        `doohickey C {
            slapTogether() {}
        }
        C c: whipUp C()!
        letMeLearnYouSomething(c)!
    `],

    ["id numeric", "handful x: 1! letMeLearnYouSomething(x)!"],

    ["id boolean", "switcheroo b: youBetcha! letMeLearnYouSomething(b)!"],

    ["id string", "chitchat s: \"hello\"! letMeLearnYouSomething(s)!" ],

    ["for loop with declared iterator", "handful x: 1!\ntilTheCowsComeHome x, x < 2, x: x + 1 { letMeLearnYouSomething(1)! }"],

    ["assign valid primitive", "handful x: 1! x: 2!"],

    ["call class with no args",
        `doohickey C {
            slapTogether() {}
        }
        letMeLearnYouSomething(C())!
    `],

    ["raw string assignment", 'chitchat s: "hello"! s: "world"!'],

    ["dot call on object",
        `doohickey Calculator {
            slapTogether() {}
            gitErDone add(handful a, handful b): handful {
                betterGetGoin a + b!
            }
        }
        Calculator calc: whipUp Calculator()!
        letMeLearnYouSomething(calc.add(2, 3))!
    `],

    ["class using its own members",
        `doohickey Circle {
            slapTogether(handful r) {
                handful radius: r!
                handful PI: 3.14!
            }
            gitErDone area(): handful {
                betterGetGoin ((radius ** 2) * PI)!
            }
        }
        Circle unitCircle: whipUp Circle(1.0)!
        letMeLearnYouSomething(unitCircle.area())!
    `],

    ["method calling outer functions",
        `gitErDone add(handful a, handful b): handful {
            betterGetGoin a + b!
        }
        doohickey Calculator {
            slapTogether() {}
            gitErDone subtract(handful a, handful b): handful {
                betterGetGoin add(a, -b)!
            }
        }
        Calculator calc: whipUp Calculator()!
        letMeLearnYouSomething(calc.subtract(3, 2))!
    `],

    ["functions calling other functions",
        `gitErDone add(handful a, handful b): handful {
            betterGetGoin a + b!
        }
        gitErDone subtract(handful a, handful b): handful {
            betterGetGoin add(a, -b)!
        }
        letMeLearnYouSomething(subtract(3, 2))!
    `],

    ["standalone function calls",
        `gitErDone add(handful a, handful b): handful {
            betterGetGoin a + b!
        }
        add(1, 1)!
    `],

    ["using members inside and outside classes",
        `doohickey NumberKeeper {
            slapTogether(handful num) {
                handful number: num!
            }
            gitErDone addOne(): handful {
                number: number + 1!
                betterGetGoin number!
            }
        }
        NumberKeeper keeper: whipUp NumberKeeper(0)!
        keeper.addOne()!
        letMeLearnYouSomething(keeper.number)!
    `],
]

// Programs that are syntactically correct but have semantic errors.
const semanticErrors = [
    ["undeclared id", "letMeLearnYouSomething(x)!", messages.notDeclaredError("x")],

    ["redeclared id", "handful x: 1! handful x: 1!", messages.alreadyDeclaredError("x")],

    ["declare wrong boolean type", "boolean x: youBetcha!", messages.notDeclaredError("boolean")],

    ["use wrong boolean literal", "switcheroo x: true!", messages.notDeclaredError("true")],

    ["assign bad type", "handful x: 1! x: youBetcha!", messages.notAssignableError("switcheroo", "handful")],

    ["assign bad array type", "handful x: 1! x: [youBetcha]!", messages.notAssignableError("todo", "handful")],

    ["break outside loop", "letsBlowThisPopsicleStand!", messages.notInLoopError()],

    ["break inside function", "gitErDone f(): handful { letsBlowThisPopsicleStand! betterGetGoin 0! }", messages.notInLoopError()],

    ["return outside function", "betterGetGoin!", messages.notInFunctionError()],

    ["return nothing from function", "gitErDone f(): handful { betterGetGoin! }", messages.returnsNothingError()],

    ["return type mismatch", "gitErDone f(): handful { return thinkAgainPal! }", messages.returnTypeMismatchError()],

    ["non-boolean short if test", "ope 1 {}", messages.notBooleanError()],

    ["non-boolean if test", "ope 1 {} welp {}", messages.notBooleanError()],

    ["non-boolean while test", "holdMyBeer 1 {}", messages.notBooleanError()],

    ["non-integer for loop", "switcheroo i: youBetcha! tilTheCowsComeHome i: youBetcha, i < 10, i: i + 1 {}", messages.notNumericError()],

    ["bad types for ||", "letMeLearnYouSomething(thinkAgainPal || 1)!", messages.notBooleanError()],

    ["bad types for &&", "letMeLearnYouSomething(thinkAgainPal && 1)!", messages.notBooleanError()],

    ["bad types for ==", "letMeLearnYouSomething(thinkAgainPal == 1)!", messages.twoDifferentTypesError()],

    ["bad types for !=", "letMeLearnYouSomething(thinkAgainPal == 1)!", messages.twoDifferentTypesError()],

    ["bad types for +", "letMeLearnYouSomething(thinkAgainPal + 1)!", messages.notNumericOrStringError()],

    ["bad types for -", "letMeLearnYouSomething(thinkAgainPal - 1)!", messages.notNumericError()],

    ["bad types for *", "letMeLearnYouSomething(thinkAgainPal * 1)!", messages.notNumericError()],

    ["bad types for /", "letMeLearnYouSomething(thinkAgainPal / 1)!", messages.notNumericError()],

    ["bad types for **", "letMeLearnYouSomething(thinkAgainPal ** 1)!", messages.notNumericError()],

    ["bad types for <", "letMeLearnYouSomething(thinkAgainPal < 1)!", messages.notNumericError()],

    ["bad types for <=", "letMeLearnYouSomething(thinkAgainPal <= 1)!", messages.notNumericError()],

    ["bad types for >", "letMeLearnYouSomething(thinkAgainPal > 1)!", messages.notNumericError()],

    ["bad types for >=", "letMeLearnYouSomething(thinkAgainPal >= 1)!", messages.notNumericError()],

    ["bad types for ==", 'letMeLearnYouSomething("hello" == 2.0)!', messages.twoDifferentTypesError()],

    ["bad types for !=", "letMeLearnYouSomething(thinkAgainPal != 1)!", messages.twoDifferentTypesError()],

    ["bad types for #", "letMeLearnYouSomething(#youBetcha)!", messages.notCollectionTypeError()],

    ["bad types for negation", "letMeLearnYouSomething(-youBetcha)!", messages.notNumericError()],

    ["bad types for not", 'letMeLearnYouSomething(nah "hello")!', messages.notBooleanError()],

    ["bad types for subscript", 'letMeLearnYouSomething(1[0])!', messages.notArrayError()],

    ["subscripting array like map", 'todo a: [1, 2]! letMeLearnYouSomething(a["hello"])!', messages.notNumericError()],

    ["non-integer index", "todo a: [1]! letMeLearnYouSomething(a[youBetcha])!", messages.notNumericError()],

    ["no such member", "doohickey S { slapTogether() { handful me.x: 0! } } S s: S()! letMeLearnYouSomething(s.y)!", messages.noMemberError()],

    ["non-distinct class members", "doohickey S { slapTogether() { handful me.x: 0! handful me.x: 0! } }", messages.nonDistinctMembersError()],

    ["self-referencing classes", "doohickey S { slapTogether(S myClass) { S me.class: myClass! } } S x: S(S(1))! letMeLearnYouSomething(x.class.number)!", messages.notDeclaredError("S")],

    ["shadowing", "handful x: 1!\nholdMyBeer youBetcha { handful x: 1! }", messages.alreadyDeclaredError("x")],

    ["call of uncallable", "handful x: 1!\nletMeLearnYouSomething(x())!", messages.functionCallOnNonFunctionError()],

    ["Too many args", "gitErDone f(handful x) {}\nf(1, 2)!", messages.argumentCountError(1, 2)],

    ["Too few args", "gitErDone f(handful x) {}\nf()!", messages.argumentCountError(1, 0)],

    ["Parameter type mismatch", "gitErDone f(handful x) {}\nf(youBetcha)!", messages.parameterTypeMismatchError()],

    ["Non-type in param", "gitErDone f(handful x, y) {}", messages.noTypeError()],

    ["No return type", "gitErDone f() { betterGetGoin 1! }", messages.noTypeError()],

    ["dotExp on non-class", "letMeLearnYouSomething((1).foo)!", messages.notClassError()],

    ["assign to a function",
        `gitErDone add(handful a, handful b): handful {
            betterGetGoin a + b!
        }
        gitErDone subtract(handful a, handful b): handful {
            betterGetGoin a - b!
        }
        add: subtract!
    `, messages.notMutableError("add")],
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
            analyze(parse("handful x: 1 + 2.2!")),
            program([
                variableDeclaration(
                    variable("x", numberType, true),
                    binaryExpression("+", 1, 2.2, numberType)
                ),
            ])
        )
    })
})

