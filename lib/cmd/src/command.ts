import { Rcon } from 'rcon-client'

export abstract class Command<TResponse = void> {

  protected constructor() {}

  public abstract execute(client: Rcon): Promise<TResponse>

  protected validateResponse(responseText: string): void {
    console.log('RESPONSE TEXT', responseText)
    if (responseText.includes('Unknown command')) {
      throw new Error(responseText)
    }
  }

}

export abstract class SimpleCommand<TResponse = void> extends Command<TResponse> {

  protected abstract readonly command: string

  public async execute(client: Rcon): Promise<TResponse> {
    const cmd = this.compile()
    const responseText = await client.send(cmd)
    this.validateResponse(responseText)
    return this.parseResponse(responseText)
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

export abstract class ComplexCommand<TResponse = void> extends Command<TResponse> {

  public async execute(client: Rcon): Promise<TResponse> {
    const cmds = this.compile()
    const cmdResponses = await Promise.all(cmds.map(cmd => cmd.execute(client)))
    return this.compileResponse(cmdResponses)
  }

  public abstract compile(): Command<any>[]

  protected abstract compileResponse(cmdResponses: any[]): TResponse

}
