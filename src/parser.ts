import { BooleanExpression } from "./ast";
import { Token, TokenType } from "./token";
import { CqlSyntaxError } from "./exceptions";

const RECOVERY_TOKENS = [TokenType.And, TokenType.Or];

export class Parser {
  private tokens: Token[];
  private current = 0;
  private report: (message: Error) => void;

  constructor(tokens: Token[], error: (message: Error) => void) {
    this.tokens = tokens;
    this.report = error;
  }

  parse(): BooleanExpression[] {
    const exressions: BooleanExpression[] = [];
    while (!this.isAtEnd()) {
      try {
        exressions.push(this.booleanExpression());
      } catch (error) {
        this.report(error);
        this.synchronize();
      }
    }
    return exressions;
  }

  private booleanExpression(): BooleanExpression {
    throw new Error("Method not implemented.");
  }

  private isAtEnd(): boolean {
    return this.peek().tokenType === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().tokenType === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): SyntaxError {
    return token.tokenType === TokenType.EOF
      ? new CqlSyntaxError(message, token.line, "EOF")
      : new CqlSyntaxError(message, token.line, `"${token.lexeme}"`);
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (RECOVERY_TOKENS.includes(this.previous().tokenType)) {
        return;
      }

      this.advance();
    }
  }
}
