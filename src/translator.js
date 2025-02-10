export default function interpret(match) {
    const grammar = match.matcher.grammar;

    const memory = new Map();

    const interpreter = grammar.createSemantics().addOperation("eval", {
    function check(condition, message, parseTreeNode) {
        if (!condition) {
            throw new Error(
                `${parseTreeNode.source.getLineAndColumnMessage()} ${message}`
            );
        }
    }
        Program(statements) {
            for (const statement of statements.children) {
                statement.eval();
            }
        },

        Stmt_increment(id, _op, _exclamation) {
            const oldVal = id.eval();
            memory.set(id.sourceString, oldVal + 1);
        },

        VarDec(type, id, _colon, exp, _exclamation) {
            memory.set(id.sourceString, exp.eval());
            // "Buster" is short for "Buster Brown."
            check(!locals.has(id.sourceString), `Whoa buster, I think I've seen this ${id.sourceString} thing before.`, this);
        },

        PrintStmt(_printKw, _leftParen, exp, _rightParen, _exclamation) {
            console.log(exp.eval());
        },

        AssignmentStmt(id, _eq, exp, _exclamation) {
            const value = exp.eval();
            const variable = id.eval();
            memory.set(id.sourceString, value);
        },

        Exp_parens(_leftParen, exp, _rightParen) {
            return exp.eval();
        },

        numeral(digits, _dot, _fractional, _e, _sign, _exponent) {
            return Number(this.sourceString);
        },

        id(_first, _rest) {
            const name = this.sourceString;
            // Currently holding the absolute shit out of our horses.
            check(locals.has(name), `Hold your horses, pal! I'm not sure what yer talking bout with this ${name} thing.`, this);
            return name;
        }
    });

    throw interpreter(match).eval();
}