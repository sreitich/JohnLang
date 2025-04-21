export default function generate(program) {
    // When generating code for statements, we'll accumulate the lines of
    // the target code here. When we finish generating, we'll join the lines
    // with newlines and return the result.
    const output = [];

    // Variable and function names in JS will be suffixed with _1, _2, _3,
    // etc. This is because "class", for example, is a legal name in John Lang,
    // but not in JS. So, the John Lang variable "class" must become something
    // like "class_1". We handle this by mapping each name to its suffix.
    const targetName = (mapping => {
        return entity => {
            if (!mapping.has(entity)) {
                mapping.set(entity, mapping.size + 1);
            }
            return `${entity.name}_${mapping.get(entity)}`;
        }
    })(new Map());

    const gen = node => generators?.[node?.kind]?.(node) ?? node;

    const generators = {
        // Key idea: when generating an expression, just return the JS string; when
        // generating a statement, write lines of translated JS to the output array.
        ClassType(d) {
            return targetName(d);
        },
        Program(p) {
            p.statements.forEach(gen);
        },
        VariableDeclaration(d) {
            output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`);
        },
        Variable(v) {
            return targetName(v);
        },
        AssignmentStatement(s) {
            output.push(`${gen(s.target)} = ${gen(s.source)};`)
        },
        FunctionDeclaration(d) {
            output.push(`function ${gen(d.fun)}(${d.fun.params.map(gen).join(", ")}) {`)
            output.push(`return ${gen(d.body)};`);
            output.push("}")
        },
        Function(f) {
            return targetName(f)
        },
        ReturnStatement(s) {
            output.push(`return ${gen(s.expression)};`)
        },
        PrintStatement(s) {
            output.push(`console.log(${gen(s.argument)});`);
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
        ForStatement(s) {
            // The iterator can be formed a lot of different ways.
            const iter = `${s.isDeclaredInline ? "let " : ""}${gen(s.variable)}${s.initialValue != null ? ` = ${gen(s.initialValue)}` : ""}`;
            output.push(`for (${iter}; ${gen(s.test)}; ${gen(s.iterVar)} = ${gen(s.iterExp)}) {`);
            s.body.forEach(gen);
            output.push("}");
        },
        BreakStatement(s) {
            output.push("break;")
        },
        ConstructorDeclaration(d) {

        },
        FieldDeclaration(d) {
            return targetName(d);
        },
        MethodDeclaration(d) {

        },
        ConstructorCall(c) {

        },
        MemberExpression(e) {
            const object = gen(e.object)
            const field = JSON.stringify(gen(e.field))
            const chain = e.op === "." ? "" : e.op
            return `(${object}${chain}[${field}])`
        },
        MemberCall(c) {

        },
        BinaryExpression(e) {
            const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op;
            return `(${gen(e.left)} ${op} ${gen(e.right)})`;
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
        SubscriptExpression(e) {
            return `${gen(e.array)}[${gen(e.index)}]`
        },
        ArrayExpression(e) {
            return `[${e.elements.map(gen).join(",")}]`
        },
        MapExpression(e) {

        },
        MapEntry(e) {

        },
        // FunctionCall(c) {
        //     const targetCode = standardFunctions.has(c.callee)
        //         ? standardFunctions.get(c.callee)(c.args.map(gen))
        //         : `${gen(c.callee)}(${c.args.map(gen).join(", ")})`
        //     // Calls in expressions vs in statements are handled differently
        //     if (c.callee.type.returnType !== voidType) {
        //         return targetCode
        //     }
        //     output.push(`${targetCode};`)
        // },
    }

    gen(program)
    return output.join("\n")
}