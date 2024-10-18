import { CqlSyntaxError } from "./exceptions";
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
      case "+":
        this.addToken(TokenType.Plus);
        break;
      case "-":
        this.addToken(TokenType.Minus);
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
      case "'":
        this.string();
        break;
      case "\\":
        this.escaped();
        break;
      case '"':
        this.addToken(TokenType.DoubleQuote);
        break;
      case "*":
        this.addToken(TokenType.Star);
        break;
      case "/":
        this.addToken(TokenType.Slash);
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isIdentifierStart(c)) {
          this.identifier();
        } else {
          this.error(this.line, `Unexpected character: ${c}`);
        }
    }
  }

  private escaped(): void {
    const c = this.advance();
    switch (c) {
      case "'":
        this.string();
      default:
        this.error(this.line, `Unexpected escaped character: ${c}`);
    }
  }

  private identifier(): void {
    while (this.isIdentifierPart(this.peek())) {
      this.advance();
    }
    const text = this.source.substring(this.start, this.current);

    const keyword = this.keywords.get(text);
    if (keyword) {
      this.addToken(keyword);
      return;
    }

    this.addToken(TokenType.Identifier);
  }

  private isIdentifierPart(c: string): boolean {
    const code = c.charCodeAt(0);
    // prettier-ignore
    return (
      this.isIdentifierStart(c) ||
      c === "." ||                            // "\x002E"
      this.isDigit(c) ||
      (code >= 0x0300 && code <= 0x036f) ||   // combining and diacritical marks
      (code >= 0x203f && code <= 0x2040)      // ‿ and ⁀
    );
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.isScientific()) {
      this.scientific();
      return;
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.Numeric, value);
  }

  private scientific() {
    const mantissa = BigInt(this.source.substring(this.start, this.current));
    this.advance();

    const exponentStart = this.current;

    const sign = this.peek();
    const isSigned = ["+", "-"].includes(sign);
    if (isSigned) {
      this.advance();
    }

    while (this.isDigit(this.peek())) {
      this.advance();
    }
    const exponent = BigInt(this.source.substring(exponentStart, this.current));

    // BigInt cannot have negative exponents
    const value =
      sign === "-"
        ? Number(mantissa) ** Number(exponent)
        : mantissa ** exponent;
    this.addToken(TokenType.Numeric, value);
  }

  private isScientific() {
    let isPotentiallyScientific = this.peek() === "E";
    const signedDigit =
      ["+", "-"].includes(this.peekNext()) && this.isDigit(this.peekNextNext());
    const unsignedSignedDigit = this.isDigit(this.peekNext());
    return isPotentiallyScientific && (signedDigit || unsignedSignedDigit);
  }

  private string(): void {
    let value = "";
    while (true) {
      if (this.isEscapeQuote(this.peek(), this.peekNext())) {
        this.advance();
        value += this.advance();
        continue;
      }
      if (this.isCharacter(this.peek())) {
        value += this.advance();
        continue;
      }
      if (this.peek() === "'") {
        this.advance();
        break;
      }
      throw new CqlSyntaxError("Unterminated string", this.line);
    }

    this.addToken(TokenType.String, value);
  }

  private isIdentifierStart(c: string): boolean {
    const code = c.charCodeAt(0);
    // prettier-ignore
    return (
      code === 0x003A ||                       // colon
      code === 0x005F ||                       // underscore
      (code >= 0x0041 && code <= 0x005A) ||    // A-Z
      (code >= 0x0061 && code <= 0x007A) ||    // a-z
      (code >= 0x00C0 && code <= 0x00D6) ||    // À-Ö Latin-1 Supplement Letters
      (code >= 0x00D8 && code <= 0x00F6) ||    // Ø-ö Latin-1 Supplement Letters
      (code >= 0x00F8 && code <= 0x02FF) ||    // ø-ÿ Latin-1 Supplement Letters
      (code >= 0x0370 && code <= 0x037D) ||    // Ͱ-ͽ Greek and Coptic (without ";")
      (code >= 0x037F && code <= 0x1FFE) ||    // See note 1.
      (code >= 0x200C && code <= 0x200D) ||    // zero width non-joiner and joiner
      (code >= 0x2070 && code <= 0x218F) ||    // See note 2.
      (code >= 0x2C00 && code <= 0x2FEF) ||    // See note 3.
      (code >= 0x3001 && code <= 0xD7FF) ||    // See note 4.
      (code >= 0xF900 && code <= 0xFDCF) ||    // See note 5.
      (code >= 0xFDF0 && code <= 0xFFFD) ||    // See note 6.
      (code >= 0x10000 && code <= 0xEFFFF)     // See note 7.
    )
  }

  private isCharacter(c: string) {
    return this.isAlpha(c) || this.isDigit(c) || this.isWhitespace(c);
  }

  private isAlpha(c: string): boolean {
    const code = c.charCodeAt(0);
    // prettier-ignore
    return (
      (code >= 0x0007 && code <= 0x0008) ||
      (code >= 0x0021 && code <= 0x0026) ||
      (code >= 0x0028 && code <= 0x002f) ||
      (code >= 0x003a && code <= 0x0084) ||
      (code >= 0x0086 && code <= 0x009f) ||
      (code >= 0x00a1 && code <= 0x167f) ||
      (code >= 0x1681 && code <= 0x1fff) ||
      (code >= 0x200b && code <= 0x2027) ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2030 && code <= 0x205e) ||
      (code >= 0x2060 && code <= 0x2fff) ||
      (code >= 0x3001 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd) ||
      (code >= 0x10000 && code <= 0x10ffff)
    );
  }

  private isDigit(c: string): boolean {
    const code = c.charCodeAt(0);
    return code >= 0x0030 && code <= 0x0039; // 0-9
  }

  private isWhitespace(c: string): boolean {
    const code = c.charCodeAt(0);
    return [
      0x0009, // Character tabulation
      0x000a, // Line feed
      0x000b, // Line tabulation
      0x000c, // Form feed
      0x000d, // Carriage return
      0x0020, // Space
      0x0085, // Next line
      0x00a0, // No-break space
      0x1680, // Ogham space mark
      0x2000, // En quad
      0x2001, // Em quad
      0x2002, // En space
      0x2003, // Em space
      0x2004, // Three-per-em space
      0x2005, // Four-per-em space
      0x2006, // Six-per-em space
      0x2007, // Figure space
      0x2008, // Punctuation space
      0x2009, // Thin space
      0x200a, // Hair space
      0x2028, // Line separator
      0x2029, // Paragraph separator
      0x202f, // Narrow no-break space
      0x205f, // Medium mathematical space
      0x3000, // Ideographic space
    ].includes(code);
  }

  private isEscapeQuote(c: string, cNext: string): boolean {
    return (c === "'" && cNext === "'") || (c === "\\" && cNext === "'");
  }

  peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }

    return this.source.charAt(this.current + 1);
  }

  peekNextNext(): string {
    if (this.current + 2 >= this.source.length) {
      return "\0";
    }

    return this.source.charAt(this.current + 2);
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
