import { Request, RequestType, SimpleRequest } from '@ts-mc/core/client'

export abstract class CommandRequest<TResponse extends any = any> extends Request<TResponse> {
  public readonly type: RequestType = RequestType.cmd
}

export abstract class SimpleCommandRequest<TResponse extends any = any> extends SimpleRequest<TResponse> {
  public readonly type: RequestType = RequestType.cmd

  protected abstract readonly command: string

  public compile(): string {
    const args = this.formatArgs()
    return `${this.command}${args ? ' ' : ''}${args}`
  }

  public toString(): string {
    return this.compile()
  }

  protected getRequestBody(): string {
    return this.compile()
  }

  public get debug() {
    return this.toString()
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.toString()}]`
  }

  protected abstract formatArgs(): string
}

export abstract class SimpleArgsCommandRequest<TArgs extends Array<any> = any[], TResponse extends any = any> extends SimpleCommandRequest<TResponse> {
  protected readonly args: TArgs

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }
}
