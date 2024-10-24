import {
  Expression,
  FunctionExpression,
  GroupedExpression,
  LiteralExpression,
  PropertyNameExpression,
  UnaryExpression,
} from "./ast";
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
    return this.unary();
  }

  private unary(): Expression {
    if (this.match(TokenType.Minus, TokenType.Plus, TokenType.Not)) {
      return new UnaryExpression(this.previous(), this.primary());
    }

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
    } else if (this.check(TokenType.DoubleQuote)) {
      return this.identifier();
    } else if (this.check(TokenType.Identifier)) {
      return this.identifier();
    } else if (this.match(TokenType.LeftParen)) {
      const expr = this.primary();
      this.consume(TokenType.RightParen, "Expect ')' after expression");
      return new GroupedExpression(expr);
    }

    throw this.error(
      this.peek(),
      `Expected expression but received ${this.peek()}`,
    );
  }

  private identifier(): Expression {
    if (this.peekNext()?.tokenType === TokenType.LeftParen) {
      return this.function();
    }

    return this.propertyName();
  }

  private function(): Expression {
    const identifier = this.consume(
      TokenType.Identifier,
      "Expected identifier",
    );

    this.consume(TokenType.LeftParen, "Expected '('");

    const args: Expression[] = [];
    if (this.match(TokenType.RightParen)) {
      return new FunctionExpression(identifier, args);
    }

    args.push(this.primary());
    while (this.match(TokenType.Comma)) {
      args.push(this.primary());
    }

    this.consume(TokenType.RightParen, "Expected ')'");

    return new FunctionExpression(identifier, args);
  }

  private propertyName(): Expression {
    if (this.match(TokenType.DoubleQuote) && this.match(TokenType.Identifier)) {
      const expr = new PropertyNameExpression(this.previous());
      if (!this.match(TokenType.DoubleQuote)) {
        throw this.error(
          this.peek(),
          `Expected closing double quote but received ${this.peek()}`,
        );
      }
      return expr;
    }
    if (this.match(TokenType.Identifier)) {
      return new PropertyNameExpression(this.previous());
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

  private peekNext(): Token | null {
    if (!this.isAtEnd()) {
      return this.tokens[this.current + 1];
    }
    return null;
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

  private check<T extends TokenType>(type: T): type is T {
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
