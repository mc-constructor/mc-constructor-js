import { SimpleMessage } from './simple-message'

export abstract class SimpleArgsMessage<TArgs extends Array<any> = any[], TResponse extends any = any> extends SimpleMessage<TResponse> {
  protected readonly args: TArgs

  public get debug(): string {
    return this.getMessageBody().toString()
  }

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }

  protected getMessageBody(): string | Uint8Array {
    return this.formatArgs()
  }
}
