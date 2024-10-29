import { Token } from "./token";

export interface Expression {
  accept<T>(visitor: ExpressionVisitor<T>): T;
}

export interface ExpressionVisitor<T> {
  visitUnaryToken(expr: UnaryToken): T;
  visitBooleanExpression(expr: BooleanExpression): T;
  visitBinaryExpression(expr: BinaryExpression): T;
  visitLogicalExpression(expr: LogicalExpression): T;
  visitLiteralExpression(expr: LiteralExpression): T;
  visitUnaryExpression(expr: UnaryExpression): T;
  visitPropertyNameExpression(expr: PropertyNameExpression): T;
  visitFunctionExpression(expr: FunctionExpression): T;
  visitGroupedExpression(expr: GroupedExpression): T;
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

export class PropertyNameExpression implements Expression {
  name: Token;

  constructor(name: Token) {
    this.name = name;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitPropertyNameExpression(this);
  }
}

export class FunctionExpression implements Expression {
  identifier: Token;
  args: Expression[];

  constructor(identifier: Token, args: Expression[]) {
    this.identifier = identifier;
    this.args = args;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitFunctionExpression(this);
  }
}

export class BinaryExpression implements Expression {
  left: Expression;
  operator: Token | UnaryToken;
  right: Expression;

  constructor(
    left: Expression,
    operator: Token | UnaryToken,
    right: Expression,
  ) {
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
  operator: Token | UnaryToken;
  right: Expression;

  constructor(
    left: Expression,
    operator: Token | UnaryToken,
    right: Expression,
  ) {
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

export class UnaryToken implements Expression {
  operator: Token;
  right: Token;

  constructor(operator: Token, right: Token) {
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitUnaryToken(this);
  }
}

export class GroupedExpression implements Expression {
  expression: Expression;

  constructor(expression: Expression) {
    this.expression = expression;
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitGroupedExpression(this);
  }
}
