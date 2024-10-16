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

  test("digit", async () => {
    const scanner = new Scanner("1", logger);
    const tokens = scanner.scanTokens();
    expect(tokens).toEqual([
      new Token(TokenType.DIGIT, "1", 1, 1),
      new Token(TokenType.EOF, "", null, 1),
    ]);
  });
});
