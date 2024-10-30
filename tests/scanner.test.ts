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
  test("EOF", () => {
    scan("", [new Token(TokenType.EOF, "", null, 1)]);
  });

  test("LeftParen", () => {
    scan("(", [
      new Token(TokenType.LeftParen, "(", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("RightParen", () => {
    scan(")", [
      new Token(TokenType.RightParen, ")", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Plus", () => {
    scan("+", [
      new Token(TokenType.Plus, "+", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Minus", () => {
    scan("-", [
      new Token(TokenType.Minus, "-", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Equal", () => {
    scan("=", [
      new Token(TokenType.Equal, "=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("NotEqual", () => {
    scan("<>", [
      new Token(TokenType.NotEqual, "<>", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Greater", () => {
    scan(">", [
      new Token(TokenType.Greater, ">", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("GreaterEqual", () => {
    scan(">=", [
      new Token(TokenType.GreaterEqual, ">=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Less", () => {
    scan("<", [
      new Token(TokenType.Less, "<", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("LessEqual", () => {
    scan("<=", [
      new Token(TokenType.LessEqual, "<=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Comma", () => {
    scan(",", [
      new Token(TokenType.Comma, ",", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String", () => {
    scan("'test'", [
      new Token(TokenType.String, "'test'", "test", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - empty", () => {
    scan("''", [
      new Token(TokenType.String, "''", "", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - unterminated string", () => {
    const scanner = new Scanner("'test", logger);
    expect(() => scanner.scanTokens()).toThrow(
      new CqlSyntaxError("Unterminated string", 1),
    );
  });

  test("String - backslash escaped quote", () => {
    scan("'te\\'st'", [
      new Token(TokenType.String, "'te\\'st'", "te'st", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - two quote escaped quote", () => {
    scan("'te''st'", [
      new Token(TokenType.String, "'te''st'", "te'st", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 1", () => {
    scan("1", [
      new Token(TokenType.Numeric, "1", 1, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - -1", () => {
    scan("-1", [
      new Token(TokenType.Minus, "-", null, 1),
      new Token(TokenType.Numeric, "1", 1, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 1.2", () => {
    scan("1.2", [
      new Token(TokenType.Numeric, "1.2", 1.2, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - -1.2", () => {
    scan("-1.2", [
      new Token(TokenType.Minus, "-", null, 1),
      new Token(TokenType.Numeric, "1.2", 1.2, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 10E2", () => {
    const scanner = new Scanner("10E2", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toHaveLength(2);
    expect(tokens[0].tokenType === TokenType.Numeric).toBeTruthy();
    expect(tokens[0].lexeme === "10E2").toBeTruthy();
    expect(tokens[0].literal === 100n).toBeTruthy();
    expect(tokens[0].line === 1).toBeTruthy();
    expect(tokens[1]).toEqual(new Token(TokenType.EOF, "", null, 1));
  });

  test("Numeric - 10E-2", () => {
    const scanner = new Scanner("10E-2", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toHaveLength(2);
    expect(tokens[0].tokenType === TokenType.Numeric).toBeTruthy();
    expect(tokens[0].lexeme === "10E-2").toBeTruthy();
    expect(tokens[0].literal === 0.01).toBeTruthy();
    expect(tokens[0].line === 1).toBeTruthy();
    expect(tokens[1]).toEqual(new Token(TokenType.EOF, "", null, 1));
  });

  test("Identifier", () => {
    scan("test", [
      new Token(TokenType.Identifier, "test", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Identifier - double quoted", () => {
    scan('"test"', [
      new Token(TokenType.DoubleQuote, '"', null, 1),
      new Token(TokenType.Identifier, "test", null, 1),
      new Token(TokenType.DoubleQuote, '"', null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("double quote", () => {
    scan('"', [
      new Token(TokenType.DoubleQuote, '"', null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Star", () => {
    scan("*", [
      new Token(TokenType.Star, "*", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Slash", () => {
    scan("/", [
      new Token(TokenType.Slash, "/", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("%", () => {
    scan("%", [
      new Token(TokenType.Modulus, "%", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("^", () => {
    scan("^", [
      new Token(TokenType.Caret, "^", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("TRUE", () => {
    scan("TRUE", [
      new Token(TokenType.True, "TRUE", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("true", () => {
    scan("true", [
      new Token(TokenType.True, "true", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("FALSE", () => {
    scan("FALSE", [
      new Token(TokenType.False, "FALSE", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("AND", () => {
    scan("AND", [
      new Token(TokenType.And, "AND", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("OR", () => {
    scan("OR", [
      new Token(TokenType.Or, "OR", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("NOT", () => {
    scan("NOT", [
      new Token(TokenType.Not, "NOT", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("LIKE", () => {
    scan("LIKE", [
      new Token(TokenType.Like, "LIKE", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("IN", () => {
    scan("IN", [
      new Token(TokenType.In, "IN", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("IS", () => {
    scan("IS", [
      new Token(TokenType.Is, "IS", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("NULL", () => {
    scan("NULL", [
      new Token(TokenType.Null, "NULL", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });
});
