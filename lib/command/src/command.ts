import { Message, MessageType, SimpleMessage } from '../../server'

export abstract class Command<TResponse extends any = any> extends Message<TResponse> {
  public readonly type: MessageType = MessageType.cmd
}

export abstract class SimpleCommand<TResponse extends any = any> extends SimpleMessage<TResponse> {
  public readonly type: MessageType = MessageType.cmd

  protected abstract readonly command: string

  public compile(): string {
    const args = this.formatArgs()
    return `${this.command}${args ? ' ' : ''}${args}`
  }

  public toString(): string {
    return this.compile()
  }

  protected getMessageBody(): string {
    return this.compile()
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.toString()}]`
  }

  protected abstract formatArgs(): string
}

export abstract class SimpleArgsCommand<TArgs extends Array<any> = any[], TResponse extends any = any> extends SimpleCommand<TResponse> {
  protected readonly args: TArgs

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }
}
