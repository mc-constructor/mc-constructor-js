import { Client, Message, MessageResponse, MessageType, PendingMessage, SimpleMessage } from '../../server'
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

export abstract class ComplexCommand extends Message {
  public readonly type: MessageType = MessageType.cmd

  public execute(client: Client): Promise<any> & PendingMessage {
    const cmds = this.compile()
    const remaining = new Set<PendingMessage>();
    let logTimeout: Timeout
    const pendingResponses = Promise.all(cmds.map(async cmd => {
      const pending = cmd.execute(client)
      remaining.add(pending)
      let result;
      let error: Error
      try {
        result = await pending
      } catch (err) {
        error = err
      }
      remaining.delete(pending)
      clearTimeout(logTimeout)
      if (remaining.size) {
        console.debug(`${this.constructor.name}: ${remaining.size} responses remaining`)
        logTimeout = setTimeout(() => {
          console.debug(`${this.constructor.name}: ${remaining.size} responses remaining`, remaining)
        }, 2500)
      } else {
        console.debug(`${this.constructor.name} complete`)
      }
      if (error) {
        throw error
      }
      return result
    }))
    return Object.assign(new Promise(async (resolve, reject) => {
      pendingResponses
        .then(this.parseResponses.bind(this))
        .then(resolve)
        .catch(reject)
    }), {
      id: 'multi' as any,
      sent: Promise.all([...remaining].map(pending => pending.sent)).then(() => {}),
    } as PendingMessage)
  }

  public abstract compile(): Command[]

  protected parseResponses(responses: MessageResponse[]): any {
    return responses
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

export class MultiCommand extends ComplexCommand {
  public readonly cmds: ReadonlyArray<Command>

  constructor(...cmds: Command[]) {
    super()
    this.cmds = cmds
  }

  public compile(): Command[] {
    return [...this.cmds]
  }
}

export function multi(...cmds: Command[]): Command {
  return new MultiCommand(...cmds)
}

export function rawCmd(cmd: string, hasResponse: boolean | number = true): Command {
  return new RawCommand(cmd, hasResponse);
}

  // 3[]4:'charegd:]_creeper}'{}colorso:0}
