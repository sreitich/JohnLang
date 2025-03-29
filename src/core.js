export function program(statements) {
    return { kind: "Program", statements, };
}

export function variableDeclaration(variable, initializer) {
    return { kind: "VariableDeclaration", variable, initializer, };
}

export function variable(name, type) {
    return { kind: "Variable", name, type, mutability: true};
}
/*
export function typeDeclaration(type) {
    return { kind: "TypeDeclaration", type };
}

*/

export const booleanType = { kind: "primitive", name: "switcheroo" };
export const numberType  = { kind: "primitive", name: "handful" };
export const stringType  = { kind: "primitive", name: "chitchat" };
export const voidType = { kind: "primitive", name: "void" };
export const anyType = { kind: "primitive", name: "any" };

export function classType(name, constructor, methods) {
    return { kind: "ClassType", name, constructor, methods };
}

export function functionDeclaration(fun) {
    return { kind: "FunctionDeclaration", fun, };
}

export function fun(name, parameters, body, returnType) {
    return { kind: "Function", name, parameters, body, returnType, }
}

// Remember: collections are typeless. That's just how John Language rolls, pal.
export function arrayType() {
    return { kind: "ArrayType", };
}

export function mapType() {
    return { kind: "MapType", };
}

export function functionType(paramTypes, returnType) {
    return { kind: "FunctionType", paramTypes, returnType, };
}

export function assignmentStatement(source, target) {
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
/*
export function objectDeclaration(name, type, args) {
    return { kind: "ObjectDeclaration", name, type, args, };
}
*/
export function constructorDeclaration(parameters, body) {
    return { kind: "ConstructorDeclaration", parameters, body, };
}
/*
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
*/
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
    };
  }

export function arrayExpression(elements) {
    return { kind: "ArrayExpression", elements, type: arrayType() };
}
/*
export function emptyArray(baseType) {
    return { kind: "EmptyArray", baseType, };
}
*/

export function mapExpression(elements) {
    return { kind: "MapExpression", elements, type: mapType() };
}

export function mapEntry(key, value) {
    return { kind: "MapEntry", key, value, };
}
/*
export function emptyMap(keyType, valueType) {
    return { kind: "EmptyMap", keyType, valueType, };
}
*/
export function memberExpression(object, op, field) {
    // Aka dot expression
    return { kind: "MemberExpression", object, op, field, type: field.type };
}
/*
export function memberCall(object, member) {
    // Aka dot call
    return { kind: "MemberCall", object, member };
}

export function functionCall(callee, args) {
    return { kind: "FunctionCall", callee, args, type: callee.type.returnType };
}
*/
export function constructorCall(callee, args) {
    return { kind: "ConstructorCall", callee, args, type: callee };
}

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
