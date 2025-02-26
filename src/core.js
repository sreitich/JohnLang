export function program(statements) {
    return {
        kind: "Program",
        statements,
    };
}

export function variable(name, type, mutable) {
    return {
        kind: "Variable",
        name,
        type,
        mutable,
    };
}

export function breakStatement() {
    return {
        kind: "BreakStatement",
    };
}

export function variableDeclaration(variable, initializer) {
    return {
        kind: "VariableDeclaration",
        variable,
        initializer,
    };
}

export function functionDeclaration(fun, body) {
    return {
        kind: "FunctionDeclaration",
        fun,
        body,
    };
}

export function func(name, parameters, returnType) {
    return {
        kind: "Function",
        name,
        parameters,
        returnType,
    }
}

export function printStatement(argument) {
    return {
        kind: "PrintStatement",
        argument,
    };
}

export function assignmentStatement(source, target) {
    return {
        kind: "AssignmentStatement",
        source,
        target,
    };
}

export function whileStatement(test, body) {
    return {
        kind: "WhileStatement",
        test,
        body,
    };
}

export function block(statements) {
    return {
        kind: "BlockStatement",
        statements,
    };
}

export function returnStatement(variable) {
    return {
        kind: "ReturnStatement",
        variable,
    };
}

export function binaryExpression(op, left, right, type) {
    return {
        kind: "BinaryExpression",
        op,
        left,
        right,
        type,
    }
}

export function unaryExpression(op, operand, type) {
    return {
        kind: "UnaryExpression",
        op,
        operand,
        type,
    }
}

export function subscriptExpression(array, index, type) {
    return {
        kind: "SubscriptExpression",
        array,
        index,
        type,
    };
}