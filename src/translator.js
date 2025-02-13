export default function interpret(match) {
    const grammar = match.matcher.grammar;

    const locals = new Map(); // string -> entity
    let target = [];

    function check(condition, message, parseTreeNode) {
        if (!condition) {
            throw new Error(
                `${parseTreeNode.source.getLineAndColumnMessage()} ${message}`
            );
        }
    }

    function checkNumber(e, parseTreeNode) {
        check(e.type === "number", `Expected number`, parseTreeNode);
    }

    function checkBoolean(e, parseTreeNode) {
        check(e.type === "boolean", `Expected boolean`, parseTreeNode);
    }

    function checkNotDeclared(name, parseTreeNode) {
        check(
            locals.has(name),
            // Currently holding the absolute shit out of our horses.
            `Hold your horses, pal! I'm not sure what yer talking bout with this ${name} thing.`,
            parseTreeNode
        );
    }

    function checkAlreadyDeclared(name, parseTreeNode) {
        check(
            !locals.has(name),
            // "Buster" is short for "Buster Brown."
            `Whoa buster, I think I've seen this ${name} thing before.`,
            parseTreeNode
        );
    }

    function emit(line) {
        target.push(line);
    }

    const translator = grammar.createSemantics().addOperation("evtranslateal", {
        Program(statements) {
            for (const statement of statements.children) {
                statement.translate();
            }
        },

        Stmt_increment(id, _op, _exclamation) {
            const variable = id.translate();
            emit(`${variable}++`);
        },

        VarDec(type, id, _colon, exp, _exclamation) {
            checkAlreadyDeclared(id.sourceString, this);
            const initializer = exp.translate();
            const variable = {
                kind: "variable",
                name: id.sourceString,
                mutable: true,
                type: initializer.type,
                toString() {
                    return this.name;
                }
            }
            locals.set(id.sourceString, variable);
            emit(`let ${variable.name} = ${initializer};`);
        },

        PrintStmt(_printKw, _leftParen, exp, _rightParen, _exclamation) {
            emit(`console.log(${exp.translate()});`);
        },

        AssignmentStmt(id, _eq, exp, _exclamation) {
            const value = exp.translate();
            const variable = id.translate();
            emit(`${variable} = ${value};`);
        },

        Stmt_break(_break, semi) {
            emit(`break;`);
        },

        Block(_open, statements, close) {
            for (const statement of statements.children) {
                statement.translate();
            }
        },

        Condition_add(left, _op, right) {
            const x = left.translate();
            const y = right.translate();
            checkNumber(x);
            checkNumber(y);
            return {
                type: "number",
                toString() {
                    return `(${x} + ${y})`;
                }
            };
        },

        Exp_parens(_leftParen, exp, _rightParen) {
            return exp.translate();
        },

        numeral(digits, _dot, _fractional, _e, _sign, _exponent) {
            return Number(this.sourceString);
        },

        id(_first, _rest) {
            const entity = locals.get(this.sourceString);
            checkNotDeclared(this.sourceString, this);
            return entity;
        },

        true(_) {
            return true;
        },

        false(_) {
            return false;
        },
    });

    translator(match).translate();
    return target;
}

Number.prototype.type = "number";
Boolean.prototype.type = "boolean";
String.prototype.type = "string";