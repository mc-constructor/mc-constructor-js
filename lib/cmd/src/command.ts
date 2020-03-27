import { Client } from '../../server'

export abstract class Command<TResponse = void> {

  protected constructor() {}

  public abstract execute(client: Client): Promise<TResponse>

  protected validateResponse(responseText: string): void {
    console.log('RESPONSE TEXT', responseText)
    if (responseText.includes('Unknown command')) {
      throw new Error(responseText)
    }
  }

}

export abstract class SimpleCommand<TResponse = void> extends Command<TResponse> {

  protected abstract readonly command: string

  public async execute(client: Client): Promise<TResponse> {
    const cmd = this.compile()
    const responseText = await client.send(cmd)
    // this.validateResponse(responseText)
    // return this.parseResponse(responseText)
    return undefined
  }

  public compile(): string {
    return `${this.command} ${this.formatArgs()}`
  }

  public toString(): string {
    return this.compile()
  }

  public [Symbol.toStringTag](): string {
    return this.toString()
  }

  protected abstract formatArgs(): string

  protected parseResponse(responseText: string): TResponse {
    return
  }
}

export abstract class SimpleArgsCommand<TResponse = void, TArgs extends Array<any> = any[]> extends SimpleCommand<TResponse> {

  protected readonly args: TArgs

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }

}

export abstract class ComplexCommand<TResponse = void> extends Command<TResponse> {

  public async execute(client: Client): Promise<TResponse> {
    const cmds = this.compile()
    const cmdResponses = await Promise.all(cmds.map(cmd => cmd.execute(client)))
    return this.compileResponse(cmdResponses)
  }

  public abstract compile(): Command<any>[]

  protected abstract compileResponse(cmdResponses: any[]): TResponse
}

export class RawCommand<TResponse = void> extends SimpleCommand<TResponse> {
  protected readonly command: string = ''

  constructor(cmd: string) {
    super()
    this.command = cmd
  }

  protected formatArgs(): string {
    return '';
  }

}

export class MultiCommand<TResponse = void> extends ComplexCommand<TResponse> {
  public readonly cmds: ReadonlyArray<Command>

  constructor(...cmds: Command[]) {
    super()
    this.cmds = cmds
  }

  public compile(): Command[] {
    return [...this.cmds]
  }

  protected compileResponse(cmdResponses: any[]): TResponse {
    return undefined
  }
}

export function multi(...cmds: Command[]): Command {
  return new MultiCommand(...cmds)
}

export function rawCmd(cmd: string): Command {
  return new RawCommand(cmd)
}

