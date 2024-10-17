import { Scanner } from "../src/scanner";
import { Token, TokenType } from "../src/token";

function logger(line: number, message: string) {
  console.log(line, message);
}

describe("scanner", () => {
  test("read empty source", async () => {
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
});
