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
}
