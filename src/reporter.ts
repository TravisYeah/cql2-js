export type Loc = {
  row: number;
  col: number;
};

function cleanCode(code: string, tabSize: number) {
  return code.replace(/\t/, " ".repeat(tabSize));
}

function formatCode(lines: string[], row: number, tabSize: number) {
  return row < lines.length
    ? `${row + 1} | ` + cleanCode(lines[row], tabSize) + "\n"
    : "";
}

export function toErrorMessage(
  src: string,
  message: string,
  loc: Loc,
  tabSize?: number,
) {
  const lines = src.split("\n");
  const { row, col } = loc;
  const _tabSize = tabSize ?? 4;
  const emptyLine = " ".repeat(row.toString().length);
  let codeLine = Math.max(0, row - 3);
  let code = "";
  while (codeLine < row + 1) {
    code += formatCode(lines, codeLine, _tabSize);
    if (codeLine === row - 1) {
      code += `${emptyLine} | ${" ".repeat(col)}^\n`;
    }
    codeLine++;
  }
  let msg = `SyntaxError: ${message} (${row}:${col})
${code}`;

  return msg;
}
