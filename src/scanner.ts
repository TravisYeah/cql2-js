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
      case "(":
        this.addToken(TokenType.LeftParen);
        break;
      case ")":
        this.addToken(TokenType.RightParen);
        break;
      case "=":
        this.addToken(TokenType.Equal);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LessEqual : TokenType.Less);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GreaterEqual : TokenType.Greater,
        );
        break;
      case ",":
        this.addToken(TokenType.Comma);
        break;
      default:
        this.error(this.line, `Unexpected character: ${c}`);
        break;
    }
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
