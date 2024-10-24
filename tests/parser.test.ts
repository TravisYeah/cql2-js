import {
  Expression,
  FunctionExpression,
  GroupedExpression,
  LiteralExpression,
  PropertyNameExpression,
  UnaryExpression,
} from "../src/ast";
import { Parser } from "../src/parser";
import { Scanner } from "../src/scanner";
import { Token, TokenType } from "../src/token";

function logger(line: number, message: string) {
  console.log(line, message);
}

function reporter(message: Error) {
  console.error(message);
}

function parse(input: string, output: Expression[]) {
  const scanner = new Scanner(input, logger);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, reporter);
  const expressions = parser.parse();
  expect(expressions).toEqual(output);
}

describe("parser", () => {
  test("EOF", () => {
    parse("", []);
  });

  test("true", () => {
    parse("true", [new LiteralExpression(true)]);
  });

  test("false", () => {
    parse("false", [new LiteralExpression(false)]);
  });

  test("numeric - integer", () => {
    parse("1", [new LiteralExpression(1)]);
  });

  test("numeric - decimal", () => {
    parse("1.2", [new LiteralExpression(1.2)]);
  });

  test("numeric - scientific notation", () => {
    parse("10E2", [new LiteralExpression(100n)]);
  });

  test("string", () => {
    parse("'test'", [new LiteralExpression("test")]);
  });

  test("property name", () => {
    parse("test", [
      new PropertyNameExpression(
        new Token(TokenType.Identifier, "test", null, 1),
      ),
    ]);
  });

  test("property name - double quotes", () => {
    parse('"test"', [
      new PropertyNameExpression(
        new Token(TokenType.Identifier, "test", null, 1),
      ),
    ]);
  });

  test("function - 1 args", () => {
    parse("test()", [
      new FunctionExpression(
        new Token(TokenType.Identifier, "test", null, 1),
        [],
      ),
    ]);
  });

  test("function - 1 arg", () => {
    parse("test(1)", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new LiteralExpression(1),
      ]),
    ]);
  });

  test("function - 2 args", () => {
    parse("test(1, 2)", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new LiteralExpression(1),
        new LiteralExpression(2),
      ]),
    ]);
  });

  test("function - 2 args", () => {
    parse("test(1, 2)", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new LiteralExpression(1),
        new LiteralExpression(2),
      ]),
    ]);
  });

  test("grouped expression", () => {
    parse("(1)", [new GroupedExpression(new LiteralExpression(1))]);
  });

  test("unary expression - -1", () => {
    parse("-1", [
      new UnaryExpression(
        new Token(TokenType.Minus, "-", null, 1),
        new LiteralExpression(1),
      ),
    ]);
  });

  test("unary expression - +1", () => {
    parse("+1", [
      new UnaryExpression(
        new Token(TokenType.Plus, "+", null, 1),
        new LiteralExpression(1),
      ),
    ]);
  });
});
