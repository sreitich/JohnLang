import * as core from "./core.js";

export default function optimize(node) {
    // TODO: Implement
    return optimizers?.[node.kind]?.(node) ?? node;
}

const optimizers = {
    Program(p) {
        p.statements = p.statements.flatMap(optimize)
        return p
    },

    VarDec(s) {
        return s
    }, 

    FunDec(f) {
        return f
    }, 

    Assignment(s) {
        return s

    }, 

    Print(s) {
        return s
    }, 

    IfStmt(s) {
        return s
    }, 
    
    LoopStmt(s) {
        return s
    }, 

    Call(s) {
        return s
    },  

    DotCall(s) {
        return s
    },  

    DotExp(s) {
        return s
    }, 

    ClassDec(s) {
        return s
    }, 

    Return(s) {
        return s
    }, 

    Break(s) {
        return s
    },   

    CheckStmt(s) {
        return s
    }, 

    ThrowStmt(s) {
        return s
    }
}