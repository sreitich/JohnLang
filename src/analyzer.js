import * as core from "./core";
import {unaryExpression} from "./core";

export default function analyze(match) {
    // throw new Error("Not yet implemented");

    const grammar = match.matcher.grammar;

    const locals = new Map();
    const target = [];

    function emit(line) {
        target.push(line);
    }

/**
 * Checks
 */

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

    function checkSameTypes(x, y, parseTreeNode) {
        check(x.type === y.type, `Operands must have the same type`, parseTreeNode);
    }

    function checkAllElementsHaveSameType(elements, parseTreeNode) {
        if (elements.length > 0) {
            const type = elements[0].type;
            for (const e of elements) {
                check(
                    e.type === type,
                    `All elements must have the same type`,
                    parseTreeNode
                );
            }
        }
    }

    function checkNotDeclared(name, parseTreeNode) {
        check(
            !locals.has(name),
            // "Buster" is short for "Buster Brown."
            `Whoa buster, I think I've seen this ${name} thing before.`,
            parseTreeNode
        );
    }

    function checkDeclared(name, parseTreeNode) {
        // Currently holding the absolute shit out of our horses.
        check(locals.has(name), `Hold your horses, pal! I'm not sure what yer talking bout with this ${name} thing.`, parseTreeNode);
    }

/**
 * Analyzer
 */

    const analyzer = grammar.createSemantics().addOperation("analyze", {

        Program(statements) {
            return core.program(statements.children.map((s) => s.analyze()));
        },

        // Statements

        Stmt_break(_break, _excl) {
            return core.breakStatement();
        },

        VarDec(type, id, _col, exp, _excl) {
            checkNotDeclared(id.sourceString, id);
            const initializer = exp.analyze();
            const variable = core.variable(id.sourceString, type.analyze(), true);
            locals.set(id.sourceString, variable);
            return core.variable(variable, initializer);
        },

        FunDec(_function, id, params, _col, type, block) {
            checkNotDeclared(id.sourceString, id);
            const parameters = params.analyze();
            const body = block.analyze();
            const fun = core.func(id.sourceString, parameters, body.type);
            locals.set(id.sourceString, fun);
            return core.functionDeclaration(fun, body);
        },

        Params(_open, params, _close) {
            return params.asIteration().children.map((p) => p.analyze());
        },

        Param(type, id) {
            checkNotDeclared(id, sourceString, id);
            const param = core.variable(id.sourceString, type.sourceString, false);
            locals.set(id.sourceString, param);
            return param;
        },

        /* TODO: left_exp is an Exp6 because assignments use the same syntax as maps (e.g. assignment: "handful x: 1!", map: "{1: true}").
         * I believe we've since added a different grammar rule for maps, so we should fix Assignment. */
        Assignment(left, _col, right, _excl) {
            const source = right.analyze();
            const target = left.analyze();
            checkSameTypes(source, target, left);
            return core.assignmentStatement(source, target);
        },

        /* TODO: We used a single if statement using optionals for simplicity but using the older if statement that's broken up into three
         * parts will make analyzing easier. */
        // IfStmt_long(_if, exp, if_block, _else, else_block) {
        // },
        //
        // IfStmt_elseif(_if, exp, if_block, _else, if_stmt) {
        // },
        //
        // IfStmt_short(_if, exp, block) {
        //
        // },

        Block(_open, statements, _close) {
            return statements.children.map((s) => s.analyze());
        },

        // Expressions

        // TODO: Allow string concatenation (separate Exp3_add and Exp3_sub, add checkNumberOrString, make sure x and y are the same type)
        Exp3_add(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkNumber(x, left);
            checkNumber(y, right);
            return core.binaryExpression(op.sourceString, x, y, "number");
        },

        Exp4_multiply(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkNumber(x, left);
            checkNumber(y, right);
            return core.binaryExpression(op.sourceString, x, y, "number");
        },

        Exp5_power(left, _op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkNumber(x, left);
            checkNumber(y, right);
            return core.binaryExpression("**", x, y, "number");
        },

        Exp5_neg(_op, operand) {
            const x = operand.analyze();
            checkNumber(x, operand);
            return unaryExpression("-", x, "number");
        },

        Exp5_inv(_op, operand) {
            const x = operand.analyze();
            checkBoolean(x, operand);
            return unaryExpression("!", x, "boolean");
        },

        id(_first, _rest) {
            const entity = locals.get(this.sourceString);
            checkDeclared(this.sourceString, this);
            return entity;
        },

        // Literals

        floatlit(_digits, _dot, _fractional, _e, _sign, _exponent) {
            return Number(this.sourceString);
        },

        intlit(_digits) {
            return Number(this.sourceString);
        },

        stringlit(_open, chars, close) {
            return chars.sourceString;
        },

        true(_) {
            return true;
        },

        false(_) {
            return false;
        }
    });

    return analyzer(match).analyze();
}

Number.prototype.type = "number";
Boolean.prototype.type = "boolean";
String.prototype.type = "string";