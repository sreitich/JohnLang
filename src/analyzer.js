import * as core from "./core.js";
import * as messages from "./messages.js";

// A context for tracking scope and control flow
class Context {
    constructor({parent = null, locals = new Map(), inLoop = false, function: f = null}) {
        Object.assign(this, {parent, locals, inLoop, function: f});
    }

    // Add a new local entity
    add(name, entity) {
        this.locals.set(name, entity);
    }

    // Look up an entity in this scope
    lookup(name) {
        let retObj;

        if (this.locals.get(name)) {
            retObj = this.locals.get(name);
        } else {
            this.locals.forEach((value, _) => {
                if (value?.kind === "ClassType") {
                    value?.methods.forEach((method) => {
                        if (method.fun.name === name) {
                            retObj = method;
                        }
                    });

                    value?.constructor?.fields?.forEach((member) => {
                        if (member.name === name) {
                            retObj = member;
                        }
                    });
                }
            })
        }

        if (retObj) {
            return retObj;
        } else {
            return this.parent?.lookup(name);
        }
    }

// Root context of the program
    static root() {
        return new Context({locals: new Map(Object.entries(core.standardLibrary))});
    }

// Starts a new context nested in this one
    newChildContext(props) {
        return new Context({...this, ...props, parent: this, locals: new Map()});
    }
}

export default function analyze(match) {
    let context = Context.root();

    // --------------------------------
    //  Check Utils
    // --------------------------------

    function check(condition, message, parseTreeNode) {
        if (!condition) {
            const prefix = parseTreeNode.source.getLineAndColumnMessage();
            throw new Error(`${prefix} ${message}`);
        }
    }

    function checkNotAlreadyDeclared(name, parseTreeNode) {
        check(!context.lookup(name), messages.alreadyDeclaredError(name), parseTreeNode);
    }

    function checkIsDeclared(name, parseTreeNode) {
        check(context.lookup(name), messages.notDeclaredError(name), parseTreeNode);
    }

    function checkIsNumericType(e, parseTreeNode) {
        check(e.type === core.numberType, messages.notNumericError(), parseTreeNode);
    }

    function checkIsNumericOrStringType(e, parseTreeNode) {
        const expectedTypes = [core.numberType, core.stringType];
        check(expectedTypes.includes(e.type), messages.notNumericOrStringError(), parseTreeNode);
    }

    function checkIsBooleanType(e, parseTreeNode) {
        check(e.type === core.booleanType, messages.notBooleanError(), parseTreeNode);
    }

    function checkHasCollectionType(e, parseTreeNode) {
        const expectedKinds = [core.arrayType().kind, core.mapType().kind];
        check((expectedKinds.includes(e.type?.kind) || e.array) /* Accounts for nested arrays */, messages.notCollectionTypeError(), parseTreeNode);
    }

    function checkIsClassType(e, parseTreeNode) {
        check(e.kind === core.classType().kind, messages.notClassError(), parseTreeNode);
    }

    function checkHasClassType(e, parseTreeNode) {
        check(e.type?.kind === core.classType().kind, messages.notClassError(), parseTreeNode);
    }

    function equivalent(t1, t2) {
        return (t2 === core.anyType) || // Super type
               (t1 === t2) ||           // Value equivalence
               (t1 && t2 &&             // Object equivalence
                t1.kind === t2.kind &&
                t1.name === t2.name);
    }

    function assignable(src, target) {
        return equivalent(src, target);
    }

    function checkIsAssignable(e, type, parseTreeNode) {
        if (typeof e !== "object" || e === null || !("type" in e)) {
            e = wrapLiteral(e);
        }

        // Arrays and maps are always mutable.
        if (e && e.kind && type && type.kind) {
            if (e.kind === core.arrayExpression().kind && type.kind === core.arrayType().kind)
                return;
            if (e.kind === core.mapExpression().kind && type.kind === core.mapType().kind)
                return;
        }

        if (e.type.kind === core.fun().kind) {
            e.type = e.type.type.returnType;
        }

        const source = typeDescription(e.type);
        const target = typeDescription(type);
        const message = messages.notAssignableError(source, target);
        check(assignable(e.type, type), message, parseTreeNode);
    }

    function isMutable(e) {
        return e.mutable;
    }

    function checkIsMutable(e, parseTreeNode) {
        check(isMutable(e), messages.notMutableError(e.name), parseTreeNode);
    }

    function checkInLoop(parseTreeNode) {
        check(context.inLoop, messages.notInLoopError(), parseTreeNode);
    }

    function checkInFunction(parseTreeNode) {
        check(context.function, messages.notInFunctionError(), parseTreeNode);
    }

    function checkIsCallable(e, parseTreeNode) {
        const callable = e.kind === core.classType().kind || e.type?.kind === core.functionType().kind || e.kind === core.methodDeclaration().kind;
        check(callable, messages.notCallableError(), parseTreeNode);
    }

    function checkMethodDeclared(classType, methodName, parseTreeNode) {
        const method = (classType.methods).find(m => m.fun.name === methodName);
        check(method, messages.methodNotDeclaredError(methodName), parseTreeNode);
        return method;
    }

    function checkIsReturnable(e, {from: f}, parseTreeNode) {
        checkIsAssignable(e, f.type.returnType, parseTreeNode);
    }

    function checkCorrectArgumentCount(argCount, paramCount, parseTreeNode) {
        check(argCount === paramCount, messages.argumentCountError(argCount, paramCount), parseTreeNode);
    }

    // --------------------------------
    //  Misc. Utils
    // --------------------------------

    function typeDescription(type) {
        switch (type.kind) {
            case "primitive":
                return type.name;
            case "ClassType":
                return type.name;
            case "ArrayType":
                return "todo";
            case "MapType":
                return "almanac";
        }
    }

    function wrapLiteral(e) {
        switch (typeof e) {
            case "number":
                return {value: e, name: e, kind: core.numberType, type: core.numberType};
            case "boolean":
                return {value: e, name: e, kind: core.booleanType, type: core.booleanType};
            case "string":
                return {value: e, name: e, kind: core.stringType, type: core.stringType};
        }
    }

    // --------------------------------
    //  Analyzer
    // --------------------------------

    const grammar = match.matcher.grammar;
    const analyzer = grammar.createSemantics().addOperation("analyze", {

        Program(statements) {
            return core.program(statements.children.map((s) => s.analyze()));
        },

        // --------------------------------
        //  Statements
        // --------------------------------

        VarDec(type, id, _col, exp, _excl) {
            checkNotAlreadyDeclared(id.sourceString, id);

            const initializer = exp.analyze();
            const variable = core.variable(id.sourceString, type.analyze());
            context.add(id.sourceString, variable);

            return core.variableDeclaration(variable, initializer);
        },

        FunDec(_function, id, params, col, type, block) {
            checkNotAlreadyDeclared(id.sourceString, id);

            const fun = core.fun(id.sourceString);
            context.add(id.sourceString, fun);
            context = context.newChildContext({inLoop: false, function: fun});

            fun.parameters = params.analyze();
            const paramTypes = fun.parameters.map(param => param.type);

            /* We intentionally let the parser allow functions to be declared without return types so we can give more
             * helpful error messages. */
            check(type.children.length, messages.noReturnTypeError(), col);
            const returnType = type.children[0].analyze();
            fun.type = core.functionType(paramTypes, returnType);

            fun.body = block.analyze();
            context = context.parent;
            return core.functionDeclaration(fun);
        },

        Params(_open, params, _close) {
            return params.asIteration().children.map(p => p.analyze());
        },

        Param(type, id) {
            checkNotAlreadyDeclared(id.sourceString, id);
            const param = core.variable(id.sourceString, type.analyze(), false);
            context.locals.set(id.sourceString, param);
            return param;
        },

        Assignment(left, _col, right, _excl) {
            const source = right.analyze();
            const target = left.analyze();
            checkIsMutable(target, left);
            checkIsAssignable(source, target.type, left);
            return core.assignmentStatement(source, target);
        },

        Print(_print, _open, exp, _close, _excl) {
            const argument = exp.analyze();
            return core.printStatement(argument);
        },

        IfStmt_long(_if, exp, if_block, _else, else_block) {
            const test = exp.analyze();
            checkIsBooleanType(test, exp);

            context = context.newChildContext();
            const consequent = if_block.analyze();

            context = context.parent;
            context = context.newChildContext();
            const alternate = else_block.analyze();

            context = context.parent;
            return core.ifStatement(test, consequent, alternate);
        },

        IfStmt_elseif(_if, exp, block, _else, trailing_if) {
            const test = exp.analyze();
            checkIsBooleanType(test, exp);

            context = context.newChildContext();
            const consequent = block.analyze();

            context = context.parent;
            const alternate = trailing_if.analyze();
            return core.ifStatement(test, consequent, alternate);
        },

        IfStmt_short(_if, exp, block) {
            const test = exp.analyze();
            checkIsBooleanType(test, exp);

            context = context.newChildContext();
            const consequent = block.analyze();

            context = context.parent;
            return core.shortIfStatement(test, consequent);
        },

        LoopStmt_while(_while, exp, block) {
            const test = exp.analyze();
            checkIsBooleanType(test, exp);

            context = context.newChildContext({inLoop: true});
            const body = block.analyze();

            context = context.parent;
            return core.whileStatement(test, body);
        },

        // For loop that declares its own iterator.
        LoopStmt_for(_for, type, id, _col1, initExp, _comma1, test, _comma2, iterationVar, _col2, iterExp, block) {
            checkNotAlreadyDeclared(id.sourceString, id);

            const iterator = core.variable(id.sourceString, type.analyze());
            context = context.newChildContext({inLoop: true});
            context.add(id.sourceString, iterator);

            const init = initExp.analyze();
            checkIsAssignable(init, iterator.type, id);

            const testExp = test.analyze();
            checkIsBooleanType(testExp, test);
            const iterTarget = iterationVar.analyze();

            checkIsMutable(iterTarget, iterationVar);
            const iterValue = iterExp.analyze();

            checkIsAssignable(iterValue, iterTarget.type, iterationVar);
            const body = block.analyze();

            context = context.parent;
            return core.forStatement(iterator, testExp, iterValue, body);
        },

        // For loop that uses a pre-declared iterator.
        LoopStmt_forWithDeclaredIter(_for, id, _comma1, test, _comma2, iterationVar, _col, iterExp, block) {
            const iterator = id.analyze();
            const testExp = test.analyze();

            checkIsBooleanType(testExp, test);
            checkIsMutable(iterator, id);

            const iterValue = iterExp.analyze();

            checkIsAssignable(iterValue, iterator.type, iterationVar);
            context = context.newChildContext({inLoop: true});

            const body = block.analyze();
            context = context.parent;
            return core.forStatement(iterator, testExp, iterValue, body);
        },

        Statement_call(stmt, _excl) {
            return stmt.analyze();
        },

        Call(id, open, expList, _close) {
            const callee = id.analyze();
            checkIsCallable(callee, id);

            const args = expList.asIteration().children.map(e => e.analyze());

            let targetTypes;
            switch (callee?.kind) {
                // Object declaration
                case core.classType().kind:
                    check(callee.constructor, messages.selfReferentialClassError(), id);
                    targetTypes = callee.constructor.parameters.map(p => p.type);
                    break;
                // Function call
                case core.fun().kind:
                    targetTypes = callee.type?.paramTypes;
                    break;
                // Method call
                case core.methodDeclaration().kind:
                    targetTypes = callee.fun?.type?.paramTypes;
                    break;
            }

            checkCorrectArgumentCount(args.length, targetTypes.length, open);
            args.forEach((arg, i) => {
                checkIsAssignable(arg, targetTypes[i], expList);
            });

            return core.constructorCall(callee, args)
        },

        DotExp(exp, _dot, id) {
            const object = exp.analyze();
            checkHasClassType(object, exp);

            let member = (object.type.members).find(m => m.name === id.sourceString);
            check(member, messages.noMemberError(), id);
            return core.memberExpression(object, ".", member);
        },

        Statement_dotCall(stmt, _excl) {
            return stmt.analyze();
        },

        DotCall(exp, _dot, call) {
            const object = exp.analyze();
            checkHasClassType(object, exp);
            checkMethodDeclared(object.type, call.children[0].sourceString, call.children[0])
            const memberCall = call.analyze();
            return core.memberCall(object, memberCall);
        },

        Block(_open, statements, _close) {
            return statements.children.map((s) => s.analyze());
        },

        ClassDec(_class, id, _open, constructor, methods, _close) {
            checkNotAlreadyDeclared(id.sourceString, id);

            const classObj = core.classType(id.sourceString, null, [], []);

            context.add(id.sourceString, classObj);
            context = context.newChildContext();
            context.inClass = classObj;

            const cons = constructor.analyze();
            classObj.constructor = cons;
            const fields = cons.fields;
            const seen = new Set();

            for (const field of fields) {
                check(!seen.has(field.name), messages.nonDistinctMembersError(), constructor);
                seen.add(field.name);
            }

            classObj.members = [...fields];
            classObj.methods = methods.children.map(m => m.analyze());

            context = context.parent;
            return classObj;
        },

        ConstructorDec(_construct, _openParen, params, _closeParen, _openBrace, fields, _closeBrace) {
            const parameters = params.asIteration().children.map(p => p.analyze());
            context = context.newChildContext({function: null});

            parameters.forEach(p => context.add(p.name, p));
            const fieldDecs = fields.children.map(f => f.analyze());
            context = context.parent;

            return {...core.constructorDeclaration(parameters, fieldDecs), fields: fieldDecs};
        },

        Field(type, id, _col, exp, _excl) {
            const fieldType = type.analyze();
            const initializer = exp.analyze();
            checkIsAssignable(initializer, fieldType, id);

            return core.fieldDeclaration(id.sourceString, fieldType, initializer);
        },

        MethodDec(_function, id, _open, params, _close, _col, type, block) {
            checkNotAlreadyDeclared(id.sourceString, id);

            // Add the method to the class's context so the class's other (subsequent) methods can call it.
            const fun = core.fun(id.sourceString, null, null, null);
            context.add(id.sourceString, fun);
            context = context.newChildContext({function: fun});

            fun.params = params.asIteration().children.map((p) => p.analyze());

            const paramTypes = fun.params.map(param => param.type);
            const returnType = type.children?.[0]?.analyze();
            fun.type = core.functionType(paramTypes, returnType);

            fun.body = block.analyze();

            context = context.parent;
            return core.methodDeclaration(fun);
        },

        ObjectDec(_new, id, _open, params, _close) {
            const classEntity = id.analyze();
            checkIsClassType(classEntity, id);
            const args = params.asIteration().children.map(e => e.analyze());
            return core.constructorCall(classEntity, args);
        },

        Return(ret, exp, _excl) {
            checkInFunction(this);

            /* We intentionally let the parser allow return statements without a return value, so we can catch them here
             * to give a more helpful error message. */
            check(exp.children.length > 0, messages.returnsNothingError(), ret);

            const retVal = exp.children[0].analyze();
            checkIsReturnable(retVal, {from: context.function}, exp);
            return core.returnStatement(retVal);
        },

        Statement_break(_break, _excl) {
            checkInLoop(this);
            return core.breakStatement();
        },

        // --------------------------------
        //  Expressions
        // --------------------------------

        Exp_or(exp, _op, exps) {
            let left = exp.analyze();
            checkIsBooleanType(left, exp);
            for (let e of exps.children) {
                let right = e.analyze();
                checkIsBooleanType(right, e);
                left = core.binaryExpression("||", left, right, core.booleanType);
            }
            return left;
        },

        Exp_and(exp, _op, exps) {
            let left = exp.analyze();
            checkIsBooleanType(left, exp);
            for (let e of exps.children) {
                let right = e.analyze();
                checkIsBooleanType(right, e);
                left = core.binaryExpression("&&", left, right, core.booleanType);
            }
            return left;
        },

        Exp2_compare(exp1, op, exp2) {
            const left = exp1.analyze();
            const right = exp2.analyze();
            if (op.sourceString === "==" || op.sourceString === "!=") {
                check(equivalent(left.type, right.type), messages.twoDifferentTypesError(), op);
            } else {
                checkIsNumericType(left, exp1);
                checkIsNumericType(right, exp2);
            }
            return core.binaryExpression(op.sourceString, left, right, core.booleanType);
        },

        Exp3_add(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            if (op.sourceString === "+") {
                checkIsNumericOrStringType(x, left);
                checkIsNumericOrStringType(y, right);
            } else {
                checkIsNumericType(x, left);
                checkIsNumericType(y, right);
            }
            return core.binaryExpression(op.sourceString, x, y, core.numberType);
        },

        Exp4_multiply(left, op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkIsNumericType(x, left);
            checkIsNumericType(y, right);
            return core.binaryExpression(op.sourceString, x, y, core.numberType);
        },

        Exp5_power(left, _op, right) {
            const x = left.analyze();
            const y = right.analyze();
            checkIsNumericType(x, left);
            checkIsNumericType(y, right);
            return core.binaryExpression("**", x, y, core.numberType);
        },

        Exp5_size(_op, exp) {
            const operand = exp.analyze();
            checkHasCollectionType(operand, exp);
            return core.unaryExpression("#", operand, core.numberType);
        },

        Exp5_neg(_op, operand) {
            const x = operand.analyze();
            checkIsNumericType(x, operand);
            return core.unaryExpression("-", x, core.numberType);
        },

        Exp5_inv(_op, operand) {
            const x = operand.analyze();
            checkIsBooleanType(x, operand);
            return core.unaryExpression("!", x, core.booleanType);
        },

        Exp6_subscript(base, _open, index, _close) {
            let baseExpr = base.analyze();
            const idx = index.analyze();

            checkHasCollectionType(baseExpr, base);

            if (baseExpr.type?.kind === core.mapType().kind) {
                return core.subscriptExpression(baseExpr, idx, core.anyType);
            } else {
                checkIsNumericType(idx, index);
                return core.subscriptExpression(baseExpr, idx, core.numberType);
            }
        },

        Exp6_parens(_open, exp, _close) {
            const x = exp.analyze();
            return core.unaryExpression("", x, x.type);
        },

        Type(id) {
            let t = context.lookup(id.sourceString);

            if (!t || typeof t !== "object" || !("kind" in t)) {
                t = core.standardLibrary[id.sourceString];
            }

            check(t, messages.notDeclaredError(id.sourceString), id);
            return t;
        },

        id(_first, _rest) {
            checkIsDeclared(this.sourceString, this);
            const entity = context.lookup(this.sourceString);

            if (entity && entity.kind === "primitive") {
                return entity;
            }
            if (typeof entity !== "object" || !("type" in entity)) {
                return entity;
            }
            return entity;
        },

        // Literals
        intlit(_digits) {
            return Number(this.sourceString)
        },

        floatlit(_digits, _dot, _fractional, _e, _sign, _exponent) {
            return Number(this.sourceString)
        },

        stringlit(_open, chars, _close) {
            return chars.sourceString
        },

        true(_) {
            return true
        },

        false(_) {
            return false
        },

        ArrayLit(_open, params, _close) {
            const elements = params.asIteration().children.map(c => c.analyze());
            return core.arrayExpression(elements);
        },

        MapLit(_open, entries, _close) {
            const elements = entries.asIteration().children.map(entry => entry.analyze());
            return core.mapExpression(elements);
        },

        MapLitEntry(key, _col, val) {
            return core.mapEntry(key.analyze(), val.analyze());
        },
    });

    return analyzer(match).analyze();
}
