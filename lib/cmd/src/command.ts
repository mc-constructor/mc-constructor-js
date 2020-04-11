import {
  Client,
  CompiledMessage, CompiledSimpleMessage,
  Message,
  MessageResponse,
  MessageType,
  PendingMessage,
  SimpleMessage
} from '../../server'
import Timeout = NodeJS.Timeout

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

class MultiCommandExecutionContext {

  public readonly remaining = new Set<PendingMessage>()
  public readonly compiled: CompiledMessage[]

  private logTimeout: Timeout

  constructor(
    client: Client,
    public readonly cmds: Command[],
  ) {
    this.compiled = cmds.map(cmd => {
      return cmd.compileMessage(client)
    })
  }

  public async executeMessage(msg: CompiledMessage): Promise<any> {
    const pending = msg.execute()
    this.remaining.add(pending)

    let result;
    let error: Error
    try {
      result = await pending
    } catch (err) {
      error = err
    }
    this.remaining.delete(pending)
    clearTimeout(this.logTimeout)
    if (this.remaining.size) {
      console.debug(`${this.constructor.name}: ${this.remaining.size} responses remaining`)
      this.logTimeout = setTimeout(() => {
        console.debug(`${this.constructor.name}: ${this.remaining.size} responses remaining`, this.remaining)
      }, 2500)
    } else {
      console.debug(`${this.constructor.name} complete`)
    }
    if (error) {
      throw error
    }
    return result
  }

}

export abstract class MultiCommand extends Command {
  private static nextInstanceId: number = 0

  public readonly type: MessageType = MessageType.cmd
  public readonly instanceId = MultiCommand.nextInstanceId++

  protected abstract readonly parallel: boolean

  public compileMessage(client: Client): CompiledMessage {
    const context = new MultiCommandExecutionContext(client, this.compile())
    const id = `${this.constructor.name}#${this.instanceId}`
    return new CompiledSimpleMessage(this.processCommands.bind(this, context), id)
  }

  protected abstract compile(): Command[]

  protected processCommands(context: MultiCommandExecutionContext): Promise<any> {
    context.compiled.forEach(async msg => {
      if (this.parallel) {
        context.executeMessage(msg)
      } else {
        await context.executeMessage(msg)
      }
    })

    return Promise.all(context.compiled.map(msg => msg.pendingMessage)).then(this.parseResponses.bind(this))
  }

  protected parseResponses(responses: MessageResponse[]): any {
    return responses
  }
}

export class PassThroughMultiCommand extends MultiCommand {

  constructor(public readonly cmds: Command[], public readonly parallel: boolean) {
    super()
  }

  protected compile(): Command[] {
    return this.cmds;
  }
}

export class RawCommand extends SimpleCommand<MessageResponse> {
  constructor(protected readonly command: string, protected readonly hasResponse: boolean | number) {
    super()
  }

  protected formatArgs(): string {
    return '';
  }

  protected parseResponse(response: MessageResponse): MessageResponse {
    return response
  }
}

export function parallel(...cmds: Command[]): Command {
  return new PassThroughMultiCommand(cmds, true)
}

export function series(...cmds: Command[]): Command {
  return new PassThroughMultiCommand(cmds, false)
}

export function rawCmd(cmd: string, hasResponse: boolean | number = true): Command {
  return new RawCommand(cmd, hasResponse);
}
