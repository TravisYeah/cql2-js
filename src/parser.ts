import {
  ArrayExpression,
  BetweenExpression,
  BinaryExpression,
  Expression,
  FunctionExpression,
  GroupedExpression,
  LiteralExpression,
  LogicalExpression,
  PropertyNameExpression,
  UnaryExpression,
  UnaryToken,
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
        this.report(
          error instanceof Error
            ? error
            : new Error(`Error while parsing: ${JSON.stringify(error)}`),
        );
        this.synchronize();
      }
    }
    return exressions;
  }

  private booleanExpression(): Expression {
    return this.or();
  }

  private or(): Expression {
    let expr = this.and();

    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpression(expr, operator, right);
    }

    return expr;
  }

  private and(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new LogicalExpression(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (
      this.match(
        TokenType.Equal,
        TokenType.NotEqual,
        TokenType.Less,
        TokenType.Greater,
        TokenType.LessEqual,
        TokenType.GreaterEqual,
        TokenType.Like,
        TokenType.Between,
        TokenType.In,
        TokenType.Not,
        TokenType.Is,
      )
    ) {
      if (
        this.previous()?.tokenType === TokenType.Not &&
        this.peek().tokenType === TokenType.Between
      ) {
        const not = this.previous();
        if (!this.match(TokenType.Between)) {
          throw this.error(
            this.peek(),
            "Expected BETWEEN keyword after NOT keyword",
          );
        }

        const left = this.term();
        if (!this.match(TokenType.And)) {
          throw this.error(
            this.peek(),
            "Expected AND keyword after BETWEEN keyword.",
          );
        }
        const right = this.term();
        expr = new BetweenExpression(expr, left, right);
        expr = new UnaryExpression(not, expr);
      } else if (this.previous()?.tokenType === TokenType.Between) {
        const left = this.term();
        if (!this.match(TokenType.And)) {
          throw this.error(
            this.peek(),
            "Expected AND keyword after BETWEEN keyword.",
          );
        }
        const right = this.term();
        expr = new BetweenExpression(expr, left, right);
      } else if (this.previous()?.tokenType === TokenType.Not) {
        const not = this.previous();

        if (!this.match(TokenType.Like, TokenType.Between, TokenType.In)) {
          throw this.error(
            this.peek(),
            "Expected LIKE, BETWEEN, or IN keyword after NOT keyword",
          );
        }
        const operator = this.previous();
        const right = this.term();
        expr = new BinaryExpression(expr, new UnaryToken(not, operator), right);
      } else {
        const operator = this.previous();
        const right = this.term();
        expr = new BinaryExpression(expr, operator, right);
      }
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.multiDiv();

    while (this.match(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.multiDiv();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private multiDiv(): Expression {
    let expr = this.powerTerm();

    while (
      this.match(
        TokenType.Star,
        TokenType.Slash,
        TokenType.Modulus,
        TokenType.Div,
      )
    ) {
      const operator = this.previous();
      const right = this.powerTerm();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private powerTerm(): Expression {
    let expr = this.unary();

    while (this.match(TokenType.Caret)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.Minus, TokenType.Plus, TokenType.Not)) {
      const operator = this.previous();
      return new UnaryExpression(operator, this.primary());
    }

    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.True)) {
      return new LiteralExpression(true);
    } else if (this.match(TokenType.False)) {
      return new LiteralExpression(false);
    } else if (this.match(TokenType.Numeric)) {
      return new LiteralExpression(this.previous()?.literal);
    } else if (this.match(TokenType.String)) {
      return new LiteralExpression(this.previous()?.literal);
    } else if (this.match(TokenType.Null)) {
      return new LiteralExpression(null);
    } else if (this.check(TokenType.DoubleQuote)) {
      return this.identifier();
    } else if (this.check(TokenType.Identifier)) {
      return this.identifier();
    } else if (this.check(TokenType.LeftParen)) {
      if (this.previous()?.tokenType === TokenType.In) {
        this.consume(TokenType.LeftParen, "Expected '(' after IN keyword");
        return this.array();
      } else {
        this.consume(
          TokenType.LeftParen,
          "Expected '(' before grouped expression",
        );
        const expr = this.primary();
        this.consume(
          TokenType.RightParen,
          "Expected ')' after grouped expression",
        );
        return new GroupedExpression(expr);
      }
    }

    throw this.error(
      this.peek(),
      `Expected expression but received ${this.peek()}`,
    );
  }

  private array(): Expression {
    const items: Expression[] = [];

    if (this.match(TokenType.RightParen)) {
      return new ArrayExpression(items);
    }

    items.push(this.primary());
    while (this.match(TokenType.Comma)) {
      items.push(this.primary());
    }

    this.consume(TokenType.RightParen, "Expected ')' after array");

    return new ArrayExpression(items);
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
