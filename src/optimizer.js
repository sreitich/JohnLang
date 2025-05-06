//----------------------------------------------------
// Optimizer Functionality
//      - Assumes x = x as no-ops
//      - False "IfStmts" as dead code
//      - False "ShortIfStmts" as dead code
//      - False "WhileLoops" as dead code
//      - Constant Folding
//      - Strength Reduction (+0, -0, *0, *1)
//      - Shortens "&&" and "||" operators
//      - Quicker Caluclations
//----------------------------------------------------

import * as core from "./core.js";

export default function optimize(node) {
  return optimizers?.[node.kind]?.(node) ?? node;
}

const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize);
    return p;
  },

  VariableDeclaration(d) {
    d.variable = optimize(d.variable);
    d.initalizer = optimize(d.initializer);
    return d;
  },

  Variable(v) {
    return v;
  },

  AssignmentStatement(s) {
    s.source = optimize(s.source);
    s.target = optimize(s.target);
    if (s.source === s.target) return [];
    return s;
  },

  FunctionDeclaration(d) {
    d.fun = optimize(d.fun);
    return d;
  },

  Function(f) {
    if (f.body) f.body = f.body.flatMap(optimize);
    return f;
  },

  FunctionType(t) {
    return t;
  },

  ReturnStatement(s) {
    s.expression = optimize(s.expression);
    return s;
  },

  PrintStatement(s) {
    s.argument = optimize(s.argument);
    return s;
  },

  FunctionCall(c) {
    c.callee = optimize(c.callee)
    c.args = c.args.map(optimize)
    return c;
  },

  IfStatement(s) {
    s.test = optimize(s.test);
    s.consequent = optimize(s.consequent);

    if (s.alternate?.kind?.endsWith?.("IfStatement")) {
      s.alternate = optimize(s.alternate);
    } else {
      s.alternate = s.alternate.flatMap(optimize);
    }

    if (s.test.constructor === Boolean) {
      return s.test ? s.consequent : s.alternate;
    }
    return s;
  },

  ShortIfStatement(s) {
    s.test = optimize(s.test);
    s.consequent = s.consequent.flatMap(optimize);
    if (s.test.constructor === Boolean) {
      return s.test ? s.consequent : [];
    }
    return s;
  },

  WhileStatement(s) {
    s.test = optimize(s.test);
    if (s.test === false) {
      return [];
    }
    s.body = s.body.flatMap(optimize);

    return s;
  },

  ForStatement(s) {
    return s;
  },

  BreakStatement(s) {
    return s;
  },

  ClassDeclaration(d) {
    return d;
  },

  ConstructorDeclaration(d) {
    return d;
  },

  FieldDeclaration(d) {
    return d;
  },

  MethodDeclaration(d) {
    return d;
  },

  ConstructorCall(c) {
    c.callee = optimize(c.callee);
    c.args = c.args.map(optimize)
    return c;
  },

  MemberExpression(e) {
    e.object = optimize(e.object)
    return e;
  },

  MemberCall(c) {
    return c;
  },

  BinaryExpression(e) {
    e.op = optimize(e.op);
    e.left = optimize(e.left);
    e.right = optimize(e.right);

    // Optimizing "**" 
    // ----------------------------------------------------
    if(e.op === "**") {
      if(e.right === 0) return 1;
      if(e.right === 1) return e.left;
      if(e.right === -1) return 1 / e.left;
    }

    // Optimizing "*" 
    // ----------------------------------------------------
    if (e.op === "*") {
      if (e.left === 0 || e.right === 0) return 0;
      if (e.left === 1) return e.right;
      if (e.right === 1) return e.left;
    }

    // Optimizing "+" 
    // ----------------------------------------------------
    if (e.op === "+") {
      if (e.left === 0) return e.right;
      if (e.right === 0) return e.left;
    }

    // Optimizing "-" 
    // ----------------------------------------------------
    if (e.op === "-") {
      if (e.left == 0) return core.unaryExpression("-", e.right);
      if (e.right === 0) return e.left;
    }

    // Optimizing "%" 
    // ----------------------------------------------------
    if (e.op === "%") {
      if(e.left <= 0 && e.right <= 0){
        if(e.left < e.right) return e.left;
      }
    }

    // General Constant Folding
    // ----------------------------------------------------
    if ([Number, BigInt].includes(e.right.constructor)) {
      if (e.op === "+") return e.left + e.right;
      if (e.op === "-") return e.left - e.right;
      if (e.op === "/") return e.left / e.right;
      if (e.op === "*") return e.left * e.right;
      if (e.op === "**") return e.left ** e.right;
      if (e.op === "%") return e.left % e.right;
      if (e.op === "<=") return e.left <= e.right;
      if (e.op === "<") return e.left < e.right;
      if (e.op === "==") return e.left === e.right;
      if (e.op === "!=") return e.left != e.right;
      if (e.op === ">=") return e.left >= e.right;
      if (e.op === ">") return e.left > e.right;
    } else if (e.op === "||") {
      if (e.left === true) return true;
      if (e.right === true) return true;
    } else if (e.op === "&&") {
      if (e.left === false) return false;
      if (e.right === false) return false;
    }

    return e;
  },

  UnaryExpression(e) {
    e.op = optimize(e.op);
    e.operand = optimize(e.operand);
    if(e.operand.constructor === Number) {
      if(e.op === "-") return -e.operand;
    }

    return e;
  },

  SubscriptExpression(e) {
    e.array = optimize(e.array)
    e.index = optimize(e.index)
    return e;
  },

  ArrayExpression(e) {
    e.elements = e.elements.flatMap(optimize);
    return e;
  },

  MapExpression(e) {
    e.elements = e.elements.map(optimize);
    return e;
  },

  MapEntry(c) {
    return c;
  },

  CheckStatement(s) {
    return s;
  },

  ThrowStatement(s) {
    return s;
  },
};
