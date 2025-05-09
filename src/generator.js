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
            output.push(`${gen(s.target)} = ${gen(s.source)};`);
        },
        FunctionDeclaration(d) {
            output.push(`function ${gen(d.fun)}(${d.fun.parameters?.length ? d.fun.parameters.map(gen).join(", ") : ""}) {`);
            d.fun.body.forEach(gen);
            output.push("}");
        },
        Function(f) {
            return targetName(f);
        },
        ReturnStatement(s) {
            output.push(`return ${gen(s.expression)};`);
        },
        PrintStatement(s) {
            output.push(`console.log(${gen(s.argument)});`);
        },
        FunctionCall(f)
        {
            const code = `${gen(f.callee)}(${f.args.map(gen).join(", ")})`;

            // Calls in expressions and statement calls need to be handled differently.
            if (f.isStatement)
            {
                output.push(`${code};`);
            }
            else
            {
                return code;
            }
        },
        IfStatement(s) {
            output.push(`if (${gen(s.test)}) {`);
            s.consequent.forEach(gen);
            if (s.alternate?.kind?.endsWith?.("IfStatement")) {
                output.push("} else");
                gen(s.alternate);
            } else {
                output.push("} else {");
                s.alternate.forEach(gen);
                output.push("}");
            }
        },
        ShortIfStatement(s) {
            output.push(`if (${gen(s.test)}) {`);
            s.consequent.forEach(gen);
            output.push("}");
        },
        WhileStatement(s) {
            output.push(`while (${gen(s.test)}) {`);
            s.body.forEach(gen);
            output.push("}");
        },
        ForStatement(s) {
            // The iterator can be formed a lot of different ways.
            const iter = `${s.isDeclaredInline ? "let " : ""}${gen(s.variable)}${s.initialValue != null ? ` = ${gen(s.initialValue)}` : ""}`;
            output.push(`for (${iter}; ${gen(s.test)}; ${gen(s.iterVar)} = ${gen(s.iterExp)}) {`);
            s.body.forEach(gen);
            output.push("}");
        },
        BreakStatement(s) {
            output.push("break;");
        },
        ClassDeclaration(d) {
            output.push(`class ${targetName(d)} {`);
            output.push(`constructor(${d.constructor.parameters.map(p => gen(p)).join(", ")}) {`);
            d.members.forEach((f) => {
                output.push(`${gen(f)} = ${gen(f.initializer)};`);
            });
            output.push(`}`);
            d.methods.forEach(gen);
            output.push(`}`);
        },
        FieldDeclaration(d) {
            return `this.${targetName(d)}`;
        },
        MethodDeclaration(d) {
            output.push(`${gen(d.fun)}(${d.fun.params?.length ? d.fun.params.map(gen).join(", ") : ""}) {`);
            d.fun.body.forEach(gen);
            output.push("}");
        },
        ConstructorCall(c) {
            return `new ${targetName(c.callee)}(${c.args.map(gen).join(", ")})`;
        },
        MemberExpression(e) {
            const object = gen(e.object);
            // When using a member outside a class definition, we have to yoink out the "this" callee.
            const field = gen(e.field).split("this.")[1];
            return `${object}${e.op}${field}`;
        },
        BinaryExpression(e) {
            const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op;
            return `(${gen(e.left)} ${op} ${gen(e.right)})`;
        },
        UnaryExpression(e) {
            const operand = gen(e.operand);
            if (e.op === "#") return `${operand}.length`;
            return `${e.op}(${operand})`;
        },
        SubscriptExpression(e) {
            return `${gen(e.array)}[${gen(e.index)}]`;
        },
        ArrayExpression(e) {
            return `[${e.elements.map(gen).join(", ")}]`;
        },
        MapExpression(e) {
            return `{${e.elements.map(gen).join(", ")}}`;
        },
        MapEntry(e) {
            return `${gen(e.key)}: ${gen(e.value)}`;
        },
        CheckStatement(s) {
            const test = gen(s.test);
            output.push(`if (!${test}) { throw \`Assertion failed: ${test}\` };`);
        },
        ThrowStatement(s) {
            output.push(`throw ${gen(s.message)};`);
        }
    }

    gen(program);
    return output.join("\n");
}