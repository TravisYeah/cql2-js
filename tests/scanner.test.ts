import { CqlSyntaxError } from "../src/exceptions";
import { Scanner } from "../src/scanner";
import { Token, TokenType } from "../src/token";

function logger(line: number, message: string) {
  console.log(line, message);
}

describe("scanner", () => {
  test("EOF", async () => {
    const scanner = new Scanner("", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([new Token(TokenType.EOF, "", null, 1)]);
  });

  test("LeftParen", async () => {
    const scanner = new Scanner("(", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.LeftParen, "(", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("RightParen", async () => {
    const scanner = new Scanner(")", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.RightParen, ")", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Equal", async () => {
    const scanner = new Scanner("=", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Equal, "=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Greater", async () => {
    const scanner = new Scanner(">", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Greater, ">", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("GreaterEqual", async () => {
    const scanner = new Scanner(">=", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.GreaterEqual, ">=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Less", async () => {
    const scanner = new Scanner("<", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Less, "<", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("LessEqual", async () => {
    const scanner = new Scanner("<=", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.LessEqual, "<=", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Comma", async () => {
    const scanner = new Scanner(",", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Comma, ",", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String", async () => {
    const scanner = new Scanner("'test'", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.String, "'test'", "test", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - empty", async () => {
    const scanner = new Scanner("''", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
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
    const scanner = new Scanner("'te\\'st'", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.String, "'te\\'st'", "te'st", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("String - two quote escaped quote", async () => {
    const scanner = new Scanner("'te''st'", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.String, "'te''st'", "te'st", 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 1", async () => {
    const scanner = new Scanner("1", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Numeric, "1", 1, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Numeric - 1.2", async () => {
    const scanner = new Scanner("1.2", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Numeric, "1.2", 1.2, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });

  test("Identifier", async () => {
    const scanner = new Scanner("test", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.Identifier, "test", null, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });
});
