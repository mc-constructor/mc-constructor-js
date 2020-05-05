export class RequestError extends Error {
  constructor(public readonly type: string, message: string, public readonly body: string | Uint8Array) {
    super(`${message} sending message ${body}`)
    this.name = `${this.constructor.name}(${type})`;
  }
}
