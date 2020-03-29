import { Client, ExpectResponse } from '../../server'

export type NonVoidResponse = object | string | number | boolean

export abstract class Command<TResponse = any> {

  protected constructor() {}

  public abstract execute(client: Client): Promise<TResponse>

  protected validateResponse(responseText: string): void {
    if (responseText.includes('Unknown command')) {
      throw new Error(responseText)
    }
  }

}

abstract class SimpleCommandBase<TResponse = any> extends Command<TResponse> {

  public abstract readonly expectResponse: ExpectResponse<TResponse>

  protected abstract readonly command: string

  public async execute(client: Client): Promise<TResponse> {
    const cmd = this.compile()
    const responseText = await client.send(cmd, this.expectResponse)
    if (typeof responseText === 'string') {
      this.validateResponse(responseText)
      return this.parseResponse(responseText)
    }
  }

  public compile(): string {
    const args = this.formatArgs()
    return `${this.command}${args ? ' ' : ''}${args}`
  }

  public toString(): string {
    return this.compile()
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.toString()}]`
  }

  protected abstract formatArgs(): string

  protected parseResponse(responseText: string): TResponse {
    return
  }
}

export abstract class SimpleCommand<TResponse extends NonVoidResponse = any> extends SimpleCommandBase<TResponse> {
  public readonly expectResponse = true as ExpectResponse<TResponse>
}

export abstract class SimpleVoidCommand extends SimpleCommandBase<void> {
  public readonly expectResponse = false
}

abstract class SimpleArgsCommandBase<TResponse = any, TArgs extends Array<any> = any[]> extends SimpleCommandBase<TResponse> {
  protected readonly args: TArgs

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }
}

export abstract class SimpleArgsCommand<TResponse extends NonVoidResponse, TArgs extends Array<any> = any[]> extends SimpleArgsCommandBase {
  public readonly expectResponse = true as ExpectResponse<TResponse>
}

export abstract class SimpleArgsVoidCommand extends SimpleArgsCommandBase<void> {
  public readonly expectResponse = false
}

export abstract class ComplexCommand<TResponse = any> extends Command<TResponse> {

  public async execute(client: Client): Promise<TResponse> {
    const cmds = this.compile()
    const exec = new Set(cmds.map(cmd => {
      const p = cmd.execute(client)
      p.then(() => exec.delete(p))
      return p
    }))
    const cmdResponses = await Promise.all(exec).catch(err => {
      console.error(err)
      return Promise.reject(err)
    })
    return this.compileResponse(cmdResponses)
  }

  public abstract compile(): Command<any>[]

  protected abstract compileResponse(cmdResponses: any[]): TResponse
}

export class RawCommand<TResponse = any> extends SimpleCommandBase<TResponse> {
  constructor(protected readonly command: string, public readonly expectResponse: ExpectResponse<TResponse>) {
    super()
  }

  protected formatArgs(): string {
    return '';
  }
}

export class MultiCommand<TResponse = any> extends ComplexCommand<TResponse> {
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

export function rawCmd<TResponse = any>(cmd: string, expectResponse: ExpectResponse<TResponse>): Command<TResponse> {
  return new RawCommand<TResponse>(cmd, expectResponse)
}

