export function program(statements) {
    return { kind: "Program", statements, };
}

export function variableDeclaration(variable, initializer) {
    return { kind: "VariableDeclaration", variable, initializer, };
}

export function variable(name, type) {
    return { kind: "Variable", name, type, };
}

export function typeDeclaration(type) {
    return { kind: "TypeDeclaration", type };
}

export const booleanType = "switcheroo";
export const numberType = "handful";
export const stringType = "chitchat";

export function classType(name, constructor, fields, methods) {
    return { kind: "Class", name, constructor, methods };
}

export function functionDeclaration(fun) {
    return { kind: "FunctionDeclaration", fun, };
}

export function func(name, parameters, body, returnType) {
    return { kind: "Function", name, parameters, body, returnType, }
}

export function arrayType(baseType) {
    return { kind: "Array", baseType, };
}

export function mapType(keyType, valueType) {
    return { kind: "Map", keyType, valueType, };
}

export function functionType(paramTypes, returnType) {
    return { kind: "FunctionType", paramTypes, returnType, };
}

export function assignment(source, target) {
    return { kind: "AssignmentStatement", source, target, };
}

export function breakStatement() {
    return { kind: "BreakStatement", };
}

export function returnStatement(expression) {
    return { kind: "ReturnStatement", expression, };
}

export function ifStatement(test, consequent, alternate) {
    return { kind: "IfStatement", test, consequent, alternate, };
}

export function shortIfStatement(test, consequent) {
    return { kind: "ShortIfStatement", test, consequent, };
}

export function whileStatement(test, body) {
    return { kind: "WhileStatement", test, body, };
}

export function forStatement(variable, test, iteration, body) {
    return { kind: "ForStatement", variable, test, iteration, body, };
}

export function printStatement(argument) {
    return { kind: "PrintStatement", argument, };
}

export function objectDeclaration(name, type, args) {
    return { kind: "ObjectDeclaration", name, type, args, };
}

export function constructorDeclaration(parameters, body) {
    return { kind: "ConstructorDeclaration", parameters, body, };
}

export function parameter(type, name) {
    return { kind: "Parameter", type, name, };
}

export function methodDeclaration(name, parameters, body, returnType) {
    return { kind: "MethodDeclaration", name, parameters, body, returnType, };
}

export function thisExpression() {
    return { kind: "ThisExpression", };
}

export function conditional(test, consequent, alternate, type) {
    return { kind: "Conditional", test, consequent, alternate, type, };
}

export function binaryExpression(op, left, right, type) {
    return { kind: "BinaryExpression", op, left, right, type, };
}

export function unaryExpression(op, operand, type) {
    return { kind: "UnaryExpression", op, operand, type, };
}

export function subscriptExpression(array, index) {
    return { kind: "SubscriptExpression", array, index, };
}

export function arrayExpression(elements) {
    return { kind: "ArrayExpression", elements, }
}

export function emptyArray(baseType) {
    return { kind: "EmptyArray", baseType, };
}

export function mapExpression(elements) {
    return { kind: "MapExpression", elements, }
}

export function mapEntry(key, value) {
    return { kind: "MapEntry", key, value, };
}

export function emptyMap(keyType, valueType) {
    return { kind: "EmptyMap", keyType, valueType, };
}

export function memberExpression(object, op, field) {
    // Aka dot expression
    return { kind: "MemberExpression", object, op, field, type: field.type };
}

export function memberCall(object, member) {
    // Aka dot call
    return { kind: "MemberCall", object, member, };
}

export function functionCall(callee, args) {
    return { kind: "FunctionCall", callee, args, };
}

Boolean.prototype.type = booleanType;
Number.prototype.type = numberType;
String.prototype.type = stringType;
