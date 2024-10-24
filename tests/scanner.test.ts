import { CqlSyntaxError } from "../src/exceptions";
import { Scanner } from "../src/scanner";
import { Token, TokenType } from "../src/token";

function logger(line: number, message: string) {
  console.log(line, message);
}

function scan(input: string, output: Token[]) {
  const scanner = new Scanner(input, logger);
  const tokens = scanner.scanTokens();
  expect(tokens).toEqual(output);
}

describe("scanner", () => {
  test("EOF", async () => {
    scan("", [new Token(TokenType.EOF, "", null, 1)]);
  });

  test("LeftParen", async () => {
    scan("(", [
      new Token(TokenType.LeftParen, "(", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("RightParen", async () => {
    scan(")", [
      new Token(TokenType.RightParen, ")", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Plus", async () => {
    scan("+", [
      new Token(TokenType.Plus, "+", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Minus", async () => {
    scan("-", [
      new Token(TokenType.Minus, "-", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Equal", async () => {
    scan("=", [
      new Token(TokenType.Equal, "=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("NotEqual", async () => {
    scan("<>", [
      new Token(TokenType.NotEqual, "<>", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Greater", async () => {
    scan(">", [
      new Token(TokenType.Greater, ">", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("GreaterEqual", async () => {
    scan(">=", [
      new Token(TokenType.GreaterEqual, ">=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Less", async () => {
    scan("<", [
      new Token(TokenType.Less, "<", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("LessEqual", async () => {
    scan("<=", [
      new Token(TokenType.LessEqual, "<=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Comma", async () => {
    scan(",", [
      new Token(TokenType.Comma, ",", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String", async () => {
    scan("'test'", [
      new Token(TokenType.String, "'test'", "test", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - empty", async () => {
    scan("''", [
      new Token(TokenType.String, "''", "", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - unterminated string", async () => {
    const scanner = new Scanner("'test", logger);
    expect(() => scanner.scanTokens()).toThrow(
      new CqlSyntaxError("Unterminated string", 1),
    );
  });

  test("String - backslash escaped quote", async () => {
    scan("'te\\'st'", [
      new Token(TokenType.String, "'te\\'st'", "te'st", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - two quote escaped quote", async () => {
    scan("'te''st'", [
      new Token(TokenType.String, "'te''st'", "te'st", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 1", async () => {
    scan("1", [
      new Token(TokenType.Numeric, "1", 1, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - -1", async () => {
    scan("-1", [
      new Token(TokenType.Minus, "-", null, 1),
      new Token(TokenType.Numeric, "1", 1, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 1.2", async () => {
    scan("1.2", [
      new Token(TokenType.Numeric, "1.2", 1.2, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - -1.2", async () => {
    scan("-1.2", [
      new Token(TokenType.Minus, "-", null, 1),
      new Token(TokenType.Numeric, "1.2", 1.2, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 10E2", async () => {
    const scanner = new Scanner("10E2", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toHaveLength(2);
    expect(tokens[0].tokenType === TokenType.Numeric).toBeTruthy();
    expect(tokens[0].lexeme === "10E2").toBeTruthy();
    expect(tokens[0].literal === 100n).toBeTruthy();
    expect(tokens[0].line === 1).toBeTruthy();
    expect(tokens[1]).toEqual(new Token(TokenType.EOF, "", null, 1));
  });

  test("Numeric - 10E-2", async () => {
    const scanner = new Scanner("10E-2", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toHaveLength(2);
    expect(tokens[0].tokenType === TokenType.Numeric).toBeTruthy();
    expect(tokens[0].lexeme === "10E-2").toBeTruthy();
    expect(tokens[0].literal === 0.01).toBeTruthy();
    expect(tokens[0].line === 1).toBeTruthy();
    expect(tokens[1]).toEqual(new Token(TokenType.EOF, "", null, 1));
  });

  test("Identifier", async () => {
    scan("test", [
      new Token(TokenType.Identifier, "test", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Identifier - double quoted", async () => {
    scan('"test"', [
      new Token(TokenType.DoubleQuote, '"', null, 1),
      new Token(TokenType.Identifier, "test", null, 1),
      new Token(TokenType.DoubleQuote, '"', null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("double quote", async () => {
    scan('"', [
      new Token(TokenType.DoubleQuote, '"', null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Star", async () => {
    scan("*", [
      new Token(TokenType.Star, "*", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Slash", async () => {
    scan("/", [
      new Token(TokenType.Slash, "/", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("%", async () => {
    scan("%", [
      new Token(TokenType.Modulus, "%", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("^", async () => {
    scan("^", [
      new Token(TokenType.Caret, "^", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("TRUE", async () => {
    scan("TRUE", [
      new Token(TokenType.True, "TRUE", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("true", async () => {
    scan("true", [
      new Token(TokenType.True, "true", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("FALSE", async () => {
    scan("FALSE", [
      new Token(TokenType.False, "FALSE", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("AND", async () => {
    scan("AND", [
      new Token(TokenType.And, "AND", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("OR", async () => {
    scan("OR", [
      new Token(TokenType.Or, "OR", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("NOT", async () => {
    scan("NOT", [
      new Token(TokenType.Not, "NOT", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });
});
