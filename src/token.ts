export class Token {
  tokenType: TokenType;
  lexeme: string;
  literal: any;
  line: number;

  constructor(
    tokenType: TokenType,
    lexeme: string,
    literal: any,
    line: number,
  ) {
    this.tokenType = tokenType;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString(): string {
    return `${this.tokenType} ${this.lexeme} ${this.literal}`;
  }
}

export enum TokenType {
  EOF = "EOF",
  LeftParen = "LeftParen",
  RightParen = "RightParen",
  NotEqual = "NotEqual",
  Equal = "Equal",
  LessEqual = "LessEqual",
  Less = "Less",
  GreaterEqual = "GreaterEqual",
  Greater = "Greater",
  Comma = "Comma",
  String = "String",
  Numeric = "Numeric",
  And = "And",
  Identifier = "Identifier",
  DoubleQuote = "DoubleQuote",
  Plus = "Plus",
  Minus = "Minus",
  Star = "Star",
  Slash = "Slash",
  Modulus = "Modulus",
  Div = "Div",
  Caret = "Caret",
  True = "True",
  False = "False",
  Date = "Date",
  Not = "Not",
  Or = "Or",
  Like = "Like",
}
