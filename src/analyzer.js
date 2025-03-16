import * as core from "./core.js";
import parse from "./parser.js";
import {assignmentStatement, unaryExpression} from "./core.js";

// A context for tracking scope and control flow
class Context {
    constructor({ parent = null, locals = new Map(), inLoop = false, function: f = null }) {
        Object.assign(this, { parent, locals, inLoop, function: f });
    }

    // Add a new local entity
    add(name, entity) {
        this.locals.set(name, entity);
    }

    // Look up an entity in this scope
    lookup(name) {
        return this.locals.get(name) || this.parent?.lookup(name);
    }

    // Root context of the program
    static root() {
        return new Context({locals: new Map(Object.entries(core.standardLibrary)) });
    }

    // Starts a new context nested in this one
    newChildContext(props) {
        return new Context({ ...this, ...props, parent: this, locals: new Map() });
    }
}

export default function analyze(match) {
    let context = Context.root();

/**
 * Checks
 */

    // Throws an error if the given condition is false.
    function check(condition, message, parseTreeNode) {
        if (!condition) {
            const prefix = parseTreeNode.source.getLineAndColumnMessage();
            throw new Error(`${prefix} ${message}`);
        }
    }

    // Throws if the given entity is already declared.
    function checkNotAlreadyDeclared(name, parseTreeNode) {
        // "Buster" is short for "Buster Brown."
        check(!context.lookup(name), `Whoa buster, I think I've seen this ${name} thing before.`, parseTreeNode);
    }

    // Throws if the entity cannot be found.
    function checkIsDeclared(entity, name, parseTreeNode) {
        // Currently holding the absolute shit out of our horses.
        check(entity, `Hold your horses, pal! I'm not sure what yer talking bout with this ${name} thing.`, parseTreeNode);
    }

    function checkIsNumericType(e, parseTreeNode) {
        check(e.type === core.numberType, "We were expectin' a handful!", parseTreeNode);
    }

    function checkIsNumbericOrStringType(e, parseTreeNode) {
        const expectedTypes = [core.numberType, core.stringType];
        check(expectedTypes.includes(e.type), "We were expectin' a handful or chitchat!", parseTreeNode);
    }

    function checkIsBooleanType(e, parseTreeNode) {
        check(e.type === core.booleanType, "We were expectin' an ol' switcheroo!", parseTreeNode);
    }

    function checkHasArrayType(e, parseTreeNode) {
        check(e.type?.kind === "ArrayType", "We were expectin' a todo!", parseTreeNode);
    }

    function checkIsArrayType(e, parseTreeNode) {
        check(e?.kind === "ArrayType", "We were expectin' a todo!", parseTreeNode);
    }

    function checkHasMapType(e, parseTreeNode) {
        check(e.type?.kind === "MapType", "We were expectin' an almanac!", parseTreeNode);
    }

    function checkIsMapType(e, parseTreeNode) {
        check(e?.kind === "MapType", "We were expectin' an almanac!", parseTreeNode);
    }

    function checkIsClassType(e, parseTreeNode) {
        check(e.type?.kind === "ClassType", "We were expectin' a doohickey!", parseTreeNode);
    }

    function checkBothHaveSameType(e1, e2, parseTreeNode) {
        check(equivalent(e1.type, e2.type), "Hey, these are two different types of thingamabobs!", parseTreeNode);
    }

    function checkAllHaveSameType(expressions, parseTreeNode) {
        check(
            expressions.slice(1).every(e => equivalent(e.type, expressions[0].type)),
            "Hey, some of these whatchamacallits are different types of thingamajigs!",
            parseTreeNode
        )
    }

    function checkIsAType(e, parseTreeNode) {
        const isPrimitiveType = /number|boolean|string|void|any/.test(e);
        const isCompositeType = /ArrayType|MapType|ClassType|FunctionType/.test(e?.kind);
        check(isPrimitiveType || isCompositeType, "This here doodad doesn't have a type!", parseTreeNode);
    }

    function equivalent(t1, t2) {
        return (
            t1 === t2 ||
            t1?.kind === t2?.kind ||
            t1.type?.kind === t2.type?.kind
        );
    }

    function typeDescription(type) {
        if (type.kind === "ClassType") return type.name;
        if (type.kind === "FunctionType") {
            const paramTypes = type.paramTypes.map(typeDescription).join(", ");
            const returnType = typeDescription(type.returnType);
            return `(${paramTypes})->${returnType}`;
        }
        if (type.kind === "ArrayType") return type.kind;
        if (type.kind === "MapType") return type.kind;

        return typeof type;
    }

    function checkIsAssignable(e, { toType: type }, parseTreeNode) {
        const source = typeDescription(e.type);
        const target = typeDescription(e.type);
        const message = `You can't make a ${source} into a ${target}, dontcha know.`
        check(assignable(e.type, type), message, parseTreeNode);
    }

    function isMutable(e) {
        return (
            (e?.kind === "Variable") ||
            (e?.kind === "MemberExpression" && isMutable(e?.object))
        );
    }

    function checkIsMutable(e, parseTreeNode) {
        check(isMutable(e), `Hey now, don't go about trying to change ${e.name}.`)
    }

    function checkMemberDeclared({ in: inClass }, member, parseTreeNode) {
        check(
            inClass.constructor.body
                .map((f) => f.variable.value.name)
                .includes(member),
            `I can't find any sorta ${member} in here that doohickey!`,
            parseTreeNode
        );
    }

    function checkMethodDeclared({ in: inClassMethods }, method, parseTreeNode) {
        check(
            inClassMethods.map((f) => f.name).includes(method),
            `I can't find any sorta ${method} in here that doohickey!`,
            parseTreeNode
        )
    }

    function checkInLoop(parseTreeNode) {
        check(context.inLoop, "There's no popsicle stand to blow!");
    }

    function checkInFunction(parseTreeNode) {
        check(context.function, "We can't get goin', 'cause we never even got there!");
    }

    function checkIsCallable(e, parseTreeNode) {
        const callable = e?.kind === "ClassType" || e.type?.kind === "FunctionType";
        check(callable, "Can't go about calling someone without a phone!", parseTreeNode)
    }

    // Throws if the given function cannot return the given entity's type.
    function checkIsReturnable(e, { from: f }, parseTreeNode) {
        checkIsAssignable(e, { toType: f.type.returnType }, parseTreeNode);
    }

    function checkCorrectArgumentCount(argCount, paramCount, parseTreeNode) {
        let expected;
        let received;

        if (paramCount === 0)
        {
            expected = "We weren't expecting any arguments, ";
        }
        else if (paramCount === 1)
        {
            expected = "We were looking for 1 argument, ";
        }
        else
        {
            expected = `We were looking for ${paramCount} arguments, `;
        }

        if (argCount === 0)
        {
            if (paramCount === 1)
            {
                received = "but we didn't get one!"
            }
            else
            {
                received = "but we didn't get any!";
            }
        }
        else if (argCount === 1)
        {
            if (paramCount === 0)
            {
                received = "but we still got one!";
            }
            else
            {
                received = "but we only got 1!";
            }
        }
        else
        {
            if (paramCount === 0)
            {
                received = "but we still got some!";
            }
            else if (argCount < paramCount)
            {
                received = `but we only got ${argCount}!`;
            }
            else
            {
                received = `but we got ${argCount}!`;
            }
        }

        const message = expected + received;
        check(argCount === paramCount, message, parseTreeNode);
    }

/**
 * Analyzer
 */

    const grammar = match.matcher.grammar;
    const analyzer = grammar.createSemantics().addOperation("analyze", {

        Program(statements) {
            return core.program(statements.children.map((s) => s.analyze()));
        },

        // Statements

        Statement_break(_break, _excl) {
            return core.breakStatement();
        },

        VarDec(type, id, _col, exp, _excl) {
            checkNotAlreadyDeclared(id.sourceString, id);
            const initializer = exp.analyze();
            const variable = core.variable(id.sourceString, type.analyze(), true);
            context.locals.set(id.sourceString, variable);
            return core.variable(variable, initializer);
        },

        FunDec(_function, id, params, _col, type, block) {
            checkNotAlreadyDeclared(id.sourceString, id);
            const parameters = params.analyze();
            const body = block.analyze();
            const fun = core.func(id.sourceString, parameters, body.type);
            context.locals.set(id.sourceString, fun);
            return core.functionDeclaration(fun, body);
        },

        Params(_open, params, _close) {
            return params.asIteration().children.map((p) => p.analyze());
        },

        Param(type, id) {
            checkNotAlreadyDeclared(id.sourceString, id);
            const param = core.variable(id.sourceString, type.sourceString, false);
            context.locals.set(id.sourceString, param);
            return param;
        },

        /* TODO: left_exp is an Exp6 because assignments use the same syntax as maps (e.g. assignment: "handful x: 1!", map: "{1: true}").
         * I believe we've since added a different grammar rule for maps, so we should fix Assignment. */
        Assignment(left, _col, right, _excl) {
            const source = right.analyze();
            const target = left.analyze();
            checkBothHaveSameType(source, target, left);
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
            checkIsBooleanType(test, exp);
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
            checkIsBooleanType(x, left);
            checkIsBooleanType(y, right);
            return core.binaryExpression("||", x, y, "boolean");
        },

        Exp_and(left, _op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkIsBooleanType(x, left);
            checkIsBooleanType(y, right);
            return core.binaryExpression("&&", x, y, "boolean");
        },

        Exp2_compare(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            if (op.sourceString === "==" || op.sourceString === "!=") {
                check(x.type === y.type, `Those ain't the same type, pal.`, op);
            } else {
                checkIsNumericType(x, left);
                checkIsNumericType(y, right);
            }
            return core.binaryExpression(op.sourceString, x, y, "boolean");
        },

        // TODO: Allow string concatenation
        Exp3_add(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkIsNumericType(x, left);
            checkIsNumericType(y, right);
            return core.binaryExpression(op.sourceString, x, y, "number");
        },

        Exp4_multiply(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            console.log(left);
            checkIsNumericType(x, left);
            checkIsNumericType(y, right);
            return core.binaryExpression(op.sourceString, x, y, "number");
        },

        Exp5_power(left, _op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkIsNumericType(x, left);
            checkIsNumericType(y, right);
            return core.binaryExpression("**", x, y, "number");
        },

        Exp5_neg(_op, operand) {
            const x = operand.analyze();
            checkIsNumericType(x, operand);
            return unaryExpression("-", x, "number");
        },

        Exp5_inv(_op, operand) {
            const x = operand.analyze();
            checkIsBooleanType(x, operand);
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
            const entity = context.lookup(this.sourceString);
            checkIsDeclared(this.sourceString, this);
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