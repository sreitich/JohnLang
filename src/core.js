// --------------------------------
//  Types
// --------------------------------

export const booleanType = { kind: "primitive", name: "switcheroo" };
export const numberType  = { kind: "primitive", name: "handful" };
export const stringType  = { kind: "primitive", name: "chitchat" };
export const voidType = { kind: "primitive", name: "void" };
export const anyType = { kind: "primitive", name: "any" };

// Remember: collections are typeless. That's just how John Language rolls, pal.
export function arrayType() {
    return { kind: "ArrayType", };
}

export function mapType() {
    return { kind: "MapType", };
}

export function classType(name, constructor, members, methods) {
    return { kind: "ClassType", name, constructor, members, methods };
}

// --------------------------------
//  Variables
// --------------------------------

export function program(statements) {
    return { kind: "Program", statements, };
}

export function variableDeclaration(variable, initializer) {
    return { kind: "VariableDeclaration", variable, initializer, };
}

export function variable(name, type) {
    return { kind: "Variable", name, type, mutable: true};
}

export function assignmentStatement(source, target) {
    return { kind: "AssignmentStatement", source, target, };
}

// --------------------------------
//  Functions
// --------------------------------

export function functionDeclaration(fun) {
    return { kind: "FunctionDeclaration", fun, };
}

export function fun(name, parameters, body, type) {
    return { kind: "Function", name, parameters, body, type, }
}

export function functionType(paramTypes, returnType) {
    return { kind: "FunctionType", paramTypes, returnType, };
}

export function returnStatement(expression) {
    return { kind: "ReturnStatement", expression, };
}

export function printStatement(argument) {
    return { kind: "PrintStatement", argument, };
}

// --------------------------------
//  If Statements
// --------------------------------

export function ifStatement(test, consequent, alternate) {
    return { kind: "IfStatement", test, consequent, alternate, };
}

export function shortIfStatement(test, consequent) {
    return { kind: "ShortIfStatement", test, consequent, };
}

// --------------------------------
//  Loops
// --------------------------------

export function whileStatement(test, body) {
    return { kind: "WhileStatement", test, body, };
}

export function forStatement(variable, test, iteration, body) {
    return { kind: "ForStatement", variable, test, iteration, body, };
}

export function breakStatement() {
    return { kind: "BreakStatement", };
}

// --------------------------------
//  Classes
// --------------------------------

export function constructorDeclaration(parameters, body) {
    return { kind: "ConstructorDeclaration", parameters, body, };
}

export function fieldDeclaration(name, type, initializer) {
    return { kind: "FieldDeclaration", name, type, initializer, mutable: true };
}

export function methodDeclaration(fun) {
    return { kind: "MethodDeclaration", fun, };
}

export function constructorCall(callee, args) {
    return { kind: "ConstructorCall", callee, args, type: callee };
}

// AKA dot expression
export function memberExpression(object, op, field) {
    return { kind: "MemberExpression", object, op, field, type: field.type };
}

// AKA dot call
export function memberCall(object, member) {
    return { kind: "MemberCall", object, member };
}

// --------------------------------
//  Expressions
// --------------------------------

export function binaryExpression(op, left, right, type) {
    return { kind: "BinaryExpression", op, left, right, type, };
}

export function unaryExpression(op, operand, type) {
    return { kind: "UnaryExpression", op, operand, type, };
}

export function subscriptExpression(arrayExpr, indexExpr, resultType) {
    return {
      kind: "SubscriptExpression",
      array: arrayExpr,
      index: indexExpr,
      type: resultType,
      mutable: true,
    };
  }

export function arrayExpression(elements) {
    return { kind: "ArrayExpression", elements, type: arrayType() };
}

export function mapExpression(elements) {
    return { kind: "MapExpression", elements, type: mapType() };
}

export function mapEntry(key, value) {
    return { kind: "MapEntry", key, value, };
}

// --------------------------------
//  Internals
// --------------------------------

export const standardLibrary = Object.freeze({
    handful: numberType,
    switcheroo: booleanType,
    chitchat: stringType,
    todo: arrayType(),
    almanac: mapType(),
    print: functionType([anyType], voidType)
});

Boolean.prototype.type = booleanType;
Number.prototype.type = numberType;
String.prototype.type = stringType;
