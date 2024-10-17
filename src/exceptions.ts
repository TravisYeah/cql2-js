export class CqlSyntaxError extends Error {
  name = "CqlSyntaxError";
  message: string;
  line?: number;
  where?: string;

  constructor(message: string, line?: number, where?: string) {
    super();
    this.message = message;
    this.line = line;
    this.where = where;
  }
}
