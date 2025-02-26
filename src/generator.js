export default function generate(program) {
    // When generating code for statements, we'll accumulate the lines of
    // the target code here. When we finish generating, we'll join the lines
    // with newlines and return the result.
    const output = []

    // Variable and function names in JS will be suffixed with _1, _2, _3,
    // etc. This is because "switch", for example, is a legal name in Carlos,
    // but not in JS. So, the Carlos variable "switch" must become something
    // like "switch_1". We handle this by mapping each name to its suffix.
    const targetName = (mapping => {
        return entity => {
            if (!mapping.has(entity)) {
                mapping.set(entity, mapping.size + 1)
            }
            return `${entity.name}_${mapping.get(entity)}`
        }
    })(new Map())

    const gen = node => generators?.[node?.kind]?.(node) ?? node

    const generators = {
        // Key idea: when generating an expression, just return the JS string; when
        // generating a statement, write lines of translated JS to the output array.
        Program(p) {
            p.statements.forEach(gen)
        },
        VariableDeclaration(d) {
            // We don't care about const vs. let in the generated code! The analyzer has
            // already checked that we never updated a const, so let is always fine.
            output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`)
        },
        FunctionDeclaration(d) {
            output.push(`function ${gen(d.fun)}(${d.fun.params.map(gen).join(", ")}) {`)
            output.push(`return ${gen(d.body)};`);
            output.push("}")
        },
        Variable(v) {
            return targetName(v)
        },
        Function(f) {
            return targetName(f)
        },
        Increment(s) {
            output.push(`${gen(s.variable)}++;`)
        },
        Assignment(s) {
            output.push(`${gen(s.target)} = ${gen(s.source)};`)
        },
        BreakStatement(s) {
            output.push("break;")
        },
        ReturnStatement(s) {
            output.push(`return ${gen(s.expression)};`)
        },
        ShortReturnStatement(s) {
            output.push("return;")
        },
        IfStatement(s) {
            output.push(`if (${gen(s.test)}) {`)
            s.consequent.forEach(gen)
            if (s.alternate?.kind?.endsWith?.("IfStatement")) {
                output.push("} else")
                gen(s.alternate)
            } else {
                output.push("} else {")
                s.alternate.forEach(gen)
                output.push("}")
            }
        },
        ShortIfStatement(s) {
            output.push(`if (${gen(s.test)}) {`)
            s.consequent.forEach(gen)
            output.push("}")
        },
        WhileStatement(s) {
            output.push(`while (${gen(s.test)}) {`)
            s.body.forEach(gen)
            output.push("}")
        },
        BinaryExpression(e) {
            const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op
            return `(${gen(e.left)} ${op} ${gen(e.right)})`
        },
        UnaryExpression(e) {
            const operand = gen(e.operand)
            if (e.op === "some") {
                return operand
            } else if (e.op === "#") {
                return `${operand}.length`
            } else if (e.op === "random") {
                return `((a=>a[~~(Math.random()*a.length)])(${operand}))`
            }
            return `${e.op}(${operand})`
        },
        EmptyOptional(e) {
            return "undefined"
        },
        SubscriptExpression(e) {
            return `${gen(e.array)}[${gen(e.index)}]`
        },
        ArrayExpression(e) {
            return `[${e.elements.map(gen).join(",")}]`
        },
        EmptyArray(e) {
            return "[]"
        },
        MemberExpression(e) {
            const object = gen(e.object)
            const field = JSON.stringify(gen(e.field))
            const chain = e.op === "." ? "" : e.op
            return `(${object}${chain}[${field}])`
        },
        FunctionCall(c) {
            const targetCode = standardFunctions.has(c.callee)
                ? standardFunctions.get(c.callee)(c.args.map(gen))
                : `${gen(c.callee)}(${c.args.map(gen).join(", ")})`
            // Calls in expressions vs in statements are handled differently
            if (c.callee.type.returnType !== voidType) {
                return targetCode
            }
            output.push(`${targetCode};`)
        },
    }

    gen(program)
    return output.join("\n")
}