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
        },

        VarDec(type, id, _colon, exp, _exclamation) {
            memory.set(id.sourceString, exp.eval());
        },

        PrintStmt(_printKw, _leftParen, exp, _rightParen, _exclamation) {
            console.log(exp.eval());
        },

        Exp_parens(_leftParen, exp, _rightParen) {
            exp.eval();
        },

        numeral(digits) {
            return Number(digits.sourceString);
        },

        id(first, rest) {
            const name = `${first.sourceString}${rest.sourceString}`;
            if (!memory.has(name)) {
                throw new Error(`Whoa there! I'm not sure what yer talking bout with this ${name} thing.`);
            }
            return memory.get(name);
        }
    });

    throw interpreter(match).eval();
}