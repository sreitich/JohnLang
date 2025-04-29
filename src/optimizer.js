//----------------------------------------------------
// Optimizer Functionality
//      - Assumes x = x as no-ops
//      - False "IfStmts" as dead code
//      - False "WhileLoops" as dead code
//      - Constant Folding
//      - Assumes x = x as no-ops
//      - Assumes x = x as no-ops
//      - Assumes x = x as no-ops
//----------------------------------------------------

import * as core from "./core.js";

export default function optimize(node) {
  // TODO: Implement
  return optimizers?.[node.kind]?.(node) ?? node;
}

const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize);
    return p;
  },

  VariableDeclaration(d) {
   
  },

  Variable(v) {
   
  },

  AssignmentStatement(s) {
    s.source = optimize(s.source);
    s.target = optimize(s.target);
    if (s.source == s.target) return [];
    return s;
  },

  FunctionDeclaration(d) {
   
  },

  Function(f) {
   
  },

  FunctionType(t) {
   
  },

  ReturnStatement(s) {
   
  },

  PrintStatement(s) {
    s.argument = optimize(s.argument);
    return s;
  },

  FunctionCall(c) {
   
  },

  IfStatement(s) {
   
  },

  ShortIfStatement(s) {
    s.test = optimize(s.test);
    s.consequent = s.consequent.flatMap(optimize);
    if(s.test.constructor === Boolean) {
        return s.test ? s.consequent : [];
    }
    return s;
  },

  WhileStatement(s) {
    s.test = optimize(s.test);
    if(s.test === false) {
        return []
    }
    s.body = s.body.flatMap(optimize);

    return s;
  },

  ForStatement(s) {
   
  },

  BreakStatement(s) {
   
  },

  ClassDeclaration(d) {
   
  },

  ConstructorDeclaration(d) {
   
  },

  FieldDeclaration(d) {
   
  },

  MethodDeclaration(d) {
   
  },

  ConstructorCall(c) {
   
  },

  MemberExpression(ed) {
   
  },

  MemberCall(c) {
   
  },

  BinaryExpression(e) {
    e.op = optimize(e.op);
    e.left = optimize(e.left);
    e.right = optimize(e.right);

    if([Number, BigInt].includes(e.right.constructor)) {
        if(e.op === "+") return e.left + e.right;
        if(e.op === "-") return e.left - e.right;
        if(e.op === "/") return e.left / e.right;
        if(e.op === "*") return e.left * e.right;
        if(e.op === "%") return e.left % e.right;
        if(e.op === "<=") return e.left <= e.right;
        if(e.op === "<") return e.left < e.right;
        if(e.op === "==") return e.left === e.right;
        if(e.op === "!=") return e.left != e.right;
        if(e.op === ">=") return e.left >= e.right;
        if(e.op === ">") return e.left > e.right;


    } else if(e.op === "||") {
        if(e.left === true) return true;
        if(e.right === true) return true;
    } else if(e.op === "&&") {
        if(e.left === false) return false;
        if(e.right === false) return false;
    }
  },

  UnaryExpression(e) {
   
  },

  SubscriptExpression(e) {
   
  },

  ArrayExpression(e) {
   
  },

  MapExpression(e) {
   
  },

  MemMapEntryberCall(c) {
   
  },

  CheckStatement(s) {
   
  },

  ThrowStatement(s) {
   
  },

  
};
