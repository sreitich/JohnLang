export default function interpret(match) {
    const grammar = match.matcher.grammar;

    const locals = new Map();
    let target = [];

    function check(condition, message, parseTreeNode) {
        if (!condition) {
            throw new Error(
                `${parseTreeNode.source.getLineAndColumnMessage()} ${message}`
            );
        }
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
            // "Buster" is short for "Buster Brown."
            check(!locals.has(id.sourceString), `Whoa buster, I think I've seen this ${id.sourceString} thing before.`, this);
            const initializer = exp.translate();
            emit(`let ${id.sourceString} = ${initializer};`);
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

        Exp_parens(_leftParen, exp, _rightParen) {
            return exp.translate();
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

    translator(match).translate();
    return target;
}