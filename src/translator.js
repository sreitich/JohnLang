export default function interpret(match) {
    const grammar = match.matcher.grammar;

    const memory = new Map();

    const interpreter = grammar.createSemantics().addOperation("eval", {
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
            if (!memory.has(name)) {
                // Currently holding the absolute shit out of our horses.
                throw new Error(`Hold your horses, pal! I'm not sure what yer talking bout with this ${name} thing.`);
            }
        }
    });

    throw interpreter(match).eval();
}