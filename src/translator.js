// NOTE: This file isn't used for the current assignment, and is not currently functional.

import * as core from "./core.js";

export default function translate(program) {
    throw new Error("Translator not yet implemented.");
}

// In-class analyzer implementation.
/**
export default function analyze(match) {
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

    const analyzer = grammar.createSemantics().addOperation("analyze", {
        Program(statements) {
            return core.program(statements.children.map((s) => s.analyze()));
        },

        Stmt_increment(id, _op, _exclamation) {
            const variable = id.analyze();
            return core.incrementStatement(variable);
        },

        VarDec(type, id, _colon, exp, _exclamation) {
            checkAlreadyDeclared(id.sourceString, this);
            const initializer = exp.analyze();
            const variable = core.variable(id.sourceString, initializer.type, true);
            locals.set(id.sourceString, variable);
            return core.variableDeclaration(variable, initializer);
        },

        PrintStmt(_printKw, _leftParen, exp, _rightParen, _exclamation) {
            const argument = exp.analyze();
            return core.printStatement(argument);
        },

        AssignmentStmt(id, _eq, exp, _exclamation) {
            const source = exp.analyze();
            const target = id.analyze();
            return core.assignmentStatement(source, target);
        },

        Stmt_break(_break, semi) {
            return core.breakStatement();
        },

        Block(_open, statements, close) {
            return statements.children.map((s) => s.analyze());
        },

        Exp_parens(_leftParen, exp, _rightParen) {
            return exp.analyze();
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

    return analyzer(match).analyze();
}
**/
Number.prototype.type = "number";
Boolean.prototype.type = "boolean";
String.prototype.type = "string";