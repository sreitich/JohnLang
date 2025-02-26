import * as core from "./core.js";
import {printStatement} from "./core.js";

export default function analyze(match) {
    // throw new Error("Not yet implemented");

    const grammar = match.matcher.grammar;

    let context = {
        locals: new Map(),
        parent: null,
    };
    const locals = new Map();
    const target = [];

    function emit(line) {
        target.push(line);
    }

    function lookup(name) {
        return context.locals.get(name) ?? (context.parent && context.parent.lookup(name));
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
        // TODO: Add proper typing
        if (name === "handful" || name === "switcheroo" || name === "chitchat") {
            return;
        }
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

        Statement_break(_break, _excl) {
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
            checkNotDeclared(id.sourceString, id);
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

        Print(_print, _open, exp, _close, _excl) {
            const argument = exp.analyze();
            return core.printStatement(argument);
        },

        IfStmt(_if, if_exp, if_block, _elseif, elseif_exp, elseif_block, _else, else_block) {

        },

        LoopStmt_while(_while, exp, block) {
            const test = exp.analyze();
            checkBoolean(test, exp);
            const body = block.analyze();
            return core.whileStatement(test, body);
        },

        Block(_open, statements, _close) {
            return statements.children.map((s) => s.analyze());
        },

        Return(_ret, exp, _excl) {
            const x = exp.analyze();
            return core.returnStatement(x);
        },

        // Expressions

        Exp_or(left, _op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkBoolean(x, left);
            checkBoolean(y, right);
            return core.binaryExpression("||", x, y, "boolean");
        },

        Exp_and(left, _op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkBoolean(x, left);
            checkBoolean(y, right);
            return core.binaryExpression("&&", x, y, "boolean");
        },

        Exp2_compare(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            if (op.sourceString === "==" || op.sourceString === "!=") {
                check(x.type === y.type, `Those ain't the same type, pal.`, op);
            } else {
                checkNumber(x, left);
                checkNumber(y, right);
            }
            return core.binaryExpression(op.sourceString, x, y, "boolean");
        },

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
            console.log(left);
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

        Exp6_subscript(array, _open, index, _close) {
            return core.subscriptExpression(
                array.analyze(),
                index.analyze(),
                "number"
            );
        },

        Exp6_parens(_open, exp, _close) {
            const x = exp.analyze();
            return core.unaryExpression("", x, x.type);
        },

        id(_first, _rest) {
            const entity = lookup(this.sourceString);
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