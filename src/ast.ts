import { Token } from "./token";

export interface Expression {
  accept<T>(visitor: ExpressionVisitor<T>): T;
}

export interface ExpressionVisitor<T> {
  visitBooleanExpression(expr: BooleanExpression): T;
  visitBinaryExpression(expr: BinaryExpression): T;
  visitLogicalExpression(expr: LogicalExpression): T;
  visitLiteralExpression(expr: LiteralExpression): T;
  visitUnaryExpression(expr: UnaryExpression): T;
}

export class BooleanExpression implements Expression {
  left: Expression;
  operator: Token;
  right: Expression;

  constructor(left: Expression, operator: Token, right: Expression) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitBooleanExpression(this);
  }
}

export class BinaryExpression implements Expression {
  left: Expression;
  operator: Token;
  right: Expression;

  constructor(left: Expression, operator: Token, right: Expression) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitBinaryExpression(this);
  }
}

export class LogicalExpression implements Expression {
  left: Expression;
  operator: Token;
  right: Expression;

  constructor(left: Expression, operator: Token, right: Expression) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLogicalExpression(this);
  }
}

export class LiteralExpression implements Expression {
  value: any;

  constructor(value: any) {
    this.value = value;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLiteralExpression(this);
  }
}

export class UnaryExpression implements Expression {
  operator: Token;
  right: Expression;

  constructor(operator: Token, right: Expression) {
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitUnaryExpression(this);
  }
}
