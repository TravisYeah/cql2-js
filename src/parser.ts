import { Expression, LiteralExpression, PropertyNameExpression } from "./ast";
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

  parse(): Expression[] {
    const exressions: Expression[] = [];
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

  private booleanExpression(): Expression {
    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.True)) {
      return new LiteralExpression(true);
    } else if (this.match(TokenType.False)) {
      return new LiteralExpression(false);
    } else if (this.match(TokenType.Numeric)) {
      return new LiteralExpression(this.previous().literal);
    } else if (this.match(TokenType.String)) {
      return new LiteralExpression(this.previous().literal);
    } else if (
      this.check(TokenType.Identifier) ||
      this.check(TokenType.DoubleQuote)
    ) {
      return this.propertyName();
    }

    throw this.error(
      this.peek(),
      `Expected expression but received ${this.peek()}`,
    );
  }

  private propertyName(): Expression {
    if (this.match(TokenType.Identifier)) {
      return new PropertyNameExpression(this.previous().literal);
    }
    if (this.match(TokenType.DoubleQuote) && this.match(TokenType.Identifier)) {
      const expr = new PropertyNameExpression(this.previous().literal);
      if (!this.match(TokenType.DoubleQuote)) {
        throw this.error(
          this.peek(),
          `Expected closing double quote but received ${this.peek()}`,
        );
      }
      return expr;
    }

    throw this.error(
      this.peek(),
      `Expected identifier but received ${this.peek()}`,
    );
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
      : new CqlSyntaxError(message, token.line, token.lexeme);
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
