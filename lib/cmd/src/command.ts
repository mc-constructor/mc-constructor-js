import { Client } from '../../server'

export abstract class Command {

  protected constructor() {}

  public abstract execute(client: Client): void
}

export abstract class SimpleCommand extends Command {

  protected abstract readonly command: string

  public execute(client: Client): void {
    const cmd = this.compile()
    client.send(cmd)
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
}

export abstract class SimpleArgsCommand<TArgs extends Array<any> = any[]> extends SimpleCommand {
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

  public execute(client: Client): void {
    const cmds = this.compile()
    cmds.forEach(cmd => cmd.execute(client))
  }

  public abstract compile(): Command[]
}

export class RawCommand extends SimpleCommand {
  constructor(protected readonly command: string) {
    super()
  }

  protected formatArgs(): string {
    return '';
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
  return new RawCommand(cmd)
}

