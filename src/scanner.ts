import { Token, TokenType } from "./token";

export class Scanner {
  source: string;
  tokens: Token[] = [];
  start = 0;
  current = 0;
  line = 1;
  error: (line: number, message: string) => void;
  keywords = new Map<string, TokenType>([]);

  constructor(source: string, error: (line: number, message: string) => void) {
    this.source = source;
    this.error = error;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  scanToken() {
    const c = this.advance();
    switch (c) {
      default:
        if (this.isDigit(c)) {
          this.number();
        }
        this.error(this.line, `Unexpected character: ${c}`);
        break;
    }
  }

  number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    this.addToken(
      TokenType.DIGIT,
      parseFloat(this.source.substring(this.start, this.current)),
    );
  }

  isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }

    return this.source.charAt(this.current + 1);
  }

  peek(): string {
    if (this.isAtEnd()) {
      return "\0";
    }
    return this.source.charAt(this.current);
  }

  match(text: string): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    if (this.source.charAt(this.current) != text) {
      return false;
    }
    this.current++;
    return true;
  }

  advance(): string {
    return this.source.charAt(this.current++);
  }

  addToken(type: TokenType, literal?: any): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal ?? null, this.line));
  }
}
