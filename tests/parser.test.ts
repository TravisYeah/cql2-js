import {
  ArrayExpression,
  BetweenExpression,
  BinaryExpression,
  Expression,
  FunctionExpression,
  GroupedExpression,
  LiteralExpression,
  LogicalExpression,
  PropertyNameExpression,
  UnaryExpression,
  UnaryToken,
} from "../src/ast";
import { CqlSyntaxError } from "../src/exceptions";
import { Parser } from "../src/parser";
import { Loc } from "../src/reporter";
import { Scanner } from "../src/scanner";
import { Token, TokenType } from "../src/token";

function logger(message: string, loc: Loc) {
  console.log(loc.row, loc.col, message);
}

function parse(input: string, output: Expression[]) {
  const errors: Error[] = [];
  function reporter(err: Error) {
    errors.push(err);
  }

  const scanner = new Scanner(input, logger);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, reporter);
  const expressions = parser.parse();
  expect(expressions).toEqual(output);
  return errors;
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

  test("function - 0 args", () => {
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

  test("function - arg property", () => {
    parse("test(prop)", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "prop", null, 1),
        ),
      ]),
    ]);
  });

  test("function - arg negative number", () => {
    parse("test(-1)", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new UnaryExpression(
          new Token(TokenType.Minus, "-", null, 1),
          new LiteralExpression(1),
        ),
      ]),
    ]);
  });

  test("function - arg power term", () => {
    parse("test(2^3)", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Caret, "^", null, 1),
          new LiteralExpression(3),
        ),
      ]),
    ]);
  });

  test("function - arg one item array", () => {
    parse("test((1,))", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new ArrayExpression([new LiteralExpression(1)]),
      ]),
    ]);
  });

  test("function - arg two item array", () => {
    parse("test((1,2))", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new ArrayExpression([
          new LiteralExpression(1),
          new LiteralExpression(2),
        ]),
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

  test("function - temporal date", () => {
    parse("test(DATE('1234-01-02'), DATE('2345-02-03'))", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new FunctionExpression(
          new Token(TokenType.Identifier, "DATE", null, 1),
          [new LiteralExpression("1234-01-02")],
        ),
        new FunctionExpression(
          new Token(TokenType.Identifier, "DATE", null, 1),
          [new LiteralExpression("2345-02-03")],
        ),
      ]),
    ]);
  });

  test("function - temporal timestamp", () => {
    parse("test(DATE('1234-01-02T12:01:01'), DATE('2345-02-03T13:11:11'))", [
      new FunctionExpression(new Token(TokenType.Identifier, "test", null, 1), [
        new FunctionExpression(
          new Token(TokenType.Identifier, "DATE", null, 1),
          [new LiteralExpression("1234-01-02T12:01:01")],
        ),
        new FunctionExpression(
          new Token(TokenType.Identifier, "DATE", null, 1),
          [new LiteralExpression("2345-02-03T13:11:11")],
        ),
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

  test("unary expression - NOT TRUE", () => {
    parse("NOT TRUE", [
      new UnaryExpression(
        new Token(TokenType.Not, "NOT", null, 1),
        new LiteralExpression(true),
      ),
    ]);
  });

  test("or", () => {
    parse("TRUE OR FALSE", [
      new LogicalExpression(
        new LiteralExpression(true),
        new Token(TokenType.Or, "OR", null, 1),
        new LiteralExpression(false),
      ),
    ]);
  });

  test("and", () => {
    parse("TRUE AND FALSE", [
      new LogicalExpression(
        new LiteralExpression(true),
        new Token(TokenType.And, "AND", null, 1),
        new LiteralExpression(false),
      ),
    ]);
  });

  test("or and", () => {
    parse("TRUE OR FALSE AND TRUE", [
      new LogicalExpression(
        new LiteralExpression(true),
        new Token(TokenType.Or, "OR", null, 1),
        new LogicalExpression(
          new LiteralExpression(false),
          new Token(TokenType.And, "AND", null, 1),
          new LiteralExpression(true),
        ),
      ),
    ]);
  });

  test("and or", () => {
    parse("TRUE AND FALSE OR TRUE", [
      new LogicalExpression(
        new LogicalExpression(
          new LiteralExpression(true),
          new Token(TokenType.And, "AND", null, 1),
          new LiteralExpression(false),
        ),
        new Token(TokenType.Or, "OR", null, 1),
        new LiteralExpression(true),
      ),
    ]);
  });

  test("=", () => {
    parse("1 = 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.Equal, "=", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("<>", () => {
    parse("1 <> 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.NotEqual, "<>", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("<", () => {
    parse("1 < 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.Less, "<", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test(">", () => {
    parse("1 > 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.Greater, ">", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("<=", () => {
    parse("1 <= 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.LessEqual, "<=", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test(">=", () => {
    parse("1 >= 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.GreaterEqual, ">=", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("LIKE", () => {
    parse("1 LIKE 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.Like, "LIKE", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("NOT LIKE", () => {
    parse("1 NOT LIKE 2", [
      new LogicalExpression(
        new LiteralExpression(1),
        new UnaryToken(
          new Token(TokenType.Not, "NOT", null, 1),
          new Token(TokenType.Like, "LIKE", null, 1),
        ),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("BETWEEN", () => {
    parse("2 BETWEEN 1 AND 3", [
      new BetweenExpression(
        new LiteralExpression(2),
        new LiteralExpression(1),
        new LiteralExpression(3),
      ),
    ]);
  });

  test("NOT BETWEEN ", () => {
    parse("1 NOT BETWEEN 2 AND 3", [
      new UnaryExpression(
        new Token(TokenType.Not, "NOT", null, 1),
        new BetweenExpression(
          new LiteralExpression(1),
          new LiteralExpression(2),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("IN", () => {
    parse("1 IN (1)", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.In, "IN", null, 1),
        new ArrayExpression([new LiteralExpression(1)]),
      ),
    ]);
  });

  test("NOT IN", () => {
    parse("1 NOT IN (1)", [
      new LogicalExpression(
        new LiteralExpression(1),
        new UnaryToken(
          new Token(TokenType.Not, "NOT", null, 1),
          new Token(TokenType.In, "IN", null, 1),
        ),
        new ArrayExpression([new LiteralExpression(1)]),
      ),
    ]);
  });

  test("IS NULL", () => {
    parse("1 IS NULL", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.Is, "IS", null, 1),
        new LiteralExpression(null),
      ),
    ]);
  });

  test("IS NOT NULL", () => {
    parse("1 IS NOT NULL", [
      new LogicalExpression(
        new LiteralExpression(1),
        new Token(TokenType.Is, "IS", null, 1),
        new UnaryExpression(
          new Token(TokenType.Not, "NOT", null, 1),
          new LiteralExpression(null),
        ),
      ),
    ]);
  });

  test("1+2", () => {
    parse("1+2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1-2", () => {
    parse("1-2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Minus, "-", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1*2", () => {
    parse("1*2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Star, "*", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1/2", () => {
    parse("1/2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Slash, "/", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1%2", () => {
    parse("1%2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Modulus, "%", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1 DIV 2", () => {
    parse("1 DIV 2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Div, "DIV", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1^2", () => {
    parse("1^2", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Caret, "^", null, 1),
        new LiteralExpression(2),
      ),
    ]);
  });

  test("1-2*3", () => {
    parse("1-2*3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Minus, "-", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Star, "*", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1+2*3", () => {
    parse("1+2*3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Star, "*", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1+2/3", () => {
    parse("1+2/3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Slash, "/", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1+2%3", () => {
    parse("1+2%3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Modulus, "%", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1+2 DIV 3", () => {
    parse("1+2 DIV 3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Div, "DIV", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1+2 DIV 3", () => {
    parse("1+2 DIV 3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Div, "DIV", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1+2^3", () => {
    parse("1+2^3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Plus, "+", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Caret, "^", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1*2^3", () => {
    parse("1*2^3", [
      new BinaryExpression(
        new LiteralExpression(1),
        new Token(TokenType.Star, "*", null, 1),
        new BinaryExpression(
          new LiteralExpression(2),
          new Token(TokenType.Caret, "^", null, 1),
          new LiteralExpression(3),
        ),
      ),
    ]);
  });

  test("1^2*3", () => {
    parse("1^2*3", [
      new BinaryExpression(
        new BinaryExpression(
          new LiteralExpression(1),
          new Token(TokenType.Caret, "^", null, 1),
          new LiteralExpression(2),
        ),
        new Token(TokenType.Star, "*", null, 1),
        new LiteralExpression(3),
      ),
    ]);
  });

  test("test=", () => {
    const errors = parse("test=", [
      new BinaryExpression(
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "test", null, 1),
        ),
        new Token(TokenType.Equal, "=", null, 1),
        new LiteralExpression(""),
      ),
    ]);

    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error).toBeInstanceOf(CqlSyntaxError);
    if (error instanceof CqlSyntaxError) {
      expect(error.line).toEqual(1);
      expect(error.message).toEqual(
        `Expected expression but received ${new Token(TokenType.EOF, "", null, 1)}`,
      );
    }
  });

  test("test<>", () => {
    const errors = parse("test<>", [
      new BinaryExpression(
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "test", null, 1),
        ),
        new Token(TokenType.NotEqual, "<>", null, 1),
        new LiteralExpression(""),
      ),
    ]);

    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error).toBeInstanceOf(CqlSyntaxError);
    if (error instanceof CqlSyntaxError) {
      expect(error.line).toEqual(1);
      expect(error.message).toEqual(
        `Expected expression but received ${new Token(TokenType.EOF, "", null, 1)}`,
      );
    }
  });

  test("test>", () => {
    const errors = parse("test>", [
      new BinaryExpression(
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "test", null, 1),
        ),
        new Token(TokenType.Greater, ">", null, 1),
        new LiteralExpression(0),
      ),
    ]);

    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error).toBeInstanceOf(CqlSyntaxError);
    if (error instanceof CqlSyntaxError) {
      expect(error.line).toEqual(1);
      expect(error.message).toEqual(
        `Expected expression but received ${new Token(TokenType.EOF, "", null, 1)}`,
      );
    }
  });

  test("test>=", () => {
    const errors = parse("test>=", [
      new BinaryExpression(
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "test", null, 1),
        ),
        new Token(TokenType.GreaterEqual, ">=", null, 1),
        new LiteralExpression(0),
      ),
    ]);

    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error).toBeInstanceOf(CqlSyntaxError);
    if (error instanceof CqlSyntaxError) {
      expect(error.line).toEqual(1);
      expect(error.message).toEqual(
        `Expected expression but received ${new Token(TokenType.EOF, "", null, 1)}`,
      );
    }
  });

  test("test<", () => {
    const errors = parse("test<", [
      new BinaryExpression(
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "test", null, 1),
        ),
        new Token(TokenType.Less, "<", null, 1),
        new LiteralExpression(0),
      ),
    ]);

    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error).toBeInstanceOf(CqlSyntaxError);
    if (error instanceof CqlSyntaxError) {
      expect(error.line).toEqual(1);
      expect(error.message).toEqual(
        `Expected expression but received ${new Token(TokenType.EOF, "", null, 1)}`,
      );
    }
  });

  test("test<=", () => {
    const errors = parse("test<=", [
      new BinaryExpression(
        new PropertyNameExpression(
          new Token(TokenType.Identifier, "test", null, 1),
        ),
        new Token(TokenType.LessEqual, "<=", null, 1),
        new LiteralExpression(0),
      ),
    ]);

    expect(errors).toHaveLength(1);
    const error = errors[0];
    expect(error).toBeInstanceOf(CqlSyntaxError);
    if (error instanceof CqlSyntaxError) {
      expect(error.line).toEqual(1);
      expect(error.message).toEqual(
        `Expected expression but received ${new Token(TokenType.EOF, "", null, 1)}`,
      );
    }
  });
});
