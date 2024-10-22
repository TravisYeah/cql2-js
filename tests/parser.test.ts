import { LiteralExpression } from "../src/ast";
import { Parser } from "../src/parser";
import { Scanner } from "../src/scanner";

function logger(line: number, message: string) {
  console.log(line, message);
}

function reporter(message: Error) {
  console.error(message);
}

describe("scanner", () => {
  test("EOF", async () => {
    const scanner = new Scanner("", logger);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, reporter);
    const expressions = parser.parse();
    expect(expressions).toEqual([]);
  });

  test("true", async () => {
    const scanner = new Scanner("true", logger);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, reporter);
    const expressions = parser.parse();
    expect(expressions).toStrictEqual([new LiteralExpression(true)]);
  });

  test("false", async () => {
    const scanner = new Scanner("false", logger);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, reporter);
    const expressions = parser.parse();
    expect(expressions).toStrictEqual([new LiteralExpression(false)]);
  });

  test("numeric - integer", async () => {
    const scanner = new Scanner("1", logger);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, reporter);
    const expressions = parser.parse();
    expect(expressions).toStrictEqual([new LiteralExpression(1)]);
  });

  test("numeric - decimal", async () => {
    const scanner = new Scanner("1.2", logger);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, reporter);
    const expressions = parser.parse();
    expect(expressions).toStrictEqual([new LiteralExpression(1.2)]);
  });

  test("numeric - scientific notation", async () => {
    const scanner = new Scanner("10E2", logger);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, reporter);
    const expressions = parser.parse();
    expect(expressions).toStrictEqual([new LiteralExpression(100n)]);
  });
});
