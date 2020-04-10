export class MessageError extends Error {
  constructor(public readonly type: string, message: string) {
    super(message)
    this.name = `${this.constructor.name}(${type})`;
  }
}
