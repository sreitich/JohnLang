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

export function incrementStatement(variable) {
    return {
        kind: "IncrementStatement",
        variable,
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

export function block(statements) {
    return {
        kind: "BlockStatement",
        statements,
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