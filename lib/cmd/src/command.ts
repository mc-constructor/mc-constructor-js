import { Client, MessageFailedResponse, MessageResponse, MessageSuccessResponse } from '../../server'
import { CommandError } from './command-error'

export abstract class Command<TResponse extends any = any> {

  protected constructor() {}

  public abstract execute(client: Client): Promise<TResponse>
}

export abstract class SimpleCommand<TResponse extends any = any> extends Command<TResponse> {

  protected abstract readonly command: string

  public async execute(client: Client): Promise<TResponse> {
    const cmd = this.compile()
    const response = await client.send(cmd)
    if (response.success === true) {
      return this.parseSuccessResponse(response)
    }
    throw this.parseFailedResponse(response)
  }

  public compile(): string {
    const args = this.formatArgs()
    return `cmd\n${this.command}${args ? ' ' : ''}${args}`
  }

  public toString(): string {
    return this.compile()
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.toString()}]`
  }

  protected abstract formatArgs(): string

  protected parseSuccessResponse(response: MessageSuccessResponse): TResponse {
    return undefined
  }

  protected parseFailedResponse(response: MessageFailedResponse): CommandError {
    const [key, message] = response.extras
    return new CommandError(key, message)
  }
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

export abstract class ComplexCommand extends Command {

  public async execute(client: Client): Promise<any> {
    const cmds = this.compile()
    const responses = await Promise.all(cmds.map(cmd => cmd.execute(client)))
    return this.parseResponses(responses)
  }

  public abstract compile(): Command[]

  protected parseResponses(responses: MessageResponse[]): any {
    return responses
  }
}

export class RawCommand extends SimpleCommand<MessageResponse> {
  constructor(protected readonly command: string) {
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

export function rawCmd(cmd: string): Command {
  return new RawCommand(cmd);
}

  // 3[]4:'charegd:]_creeper}'{}colorso:0}
