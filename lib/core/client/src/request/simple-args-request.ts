import { SimpleRequest } from './simple-request'

export abstract class SimpleArgsRequest<TArgs extends Array<any> = any[], TResponse extends any = any> extends SimpleRequest<TResponse> {
  protected readonly args: TArgs

  public get debug(): string {
    return this.getRequestBody().toString()
  }

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }

  protected getRequestBody(): string | Uint8Array {
    return this.formatArgs()
  }
}
