import {
  Client,
  CompiledMessage,
  CompiledSimpleMessage,
  ClientMessageResponse,
  MessageType,
  PendingMessage
} from '../../server'

import { Command } from './command'

import Timeout = NodeJS.Timeout

class MultiCommandExecutionContext {

  public readonly compiled: CompiledMessage[]

  constructor(
    client: Client,
    public readonly cmds: Command[],
  ) {
    this.compiled = cmds.map(cmd => {
      return cmd.compileMessage(client)
    })
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
    return new CompiledSimpleMessage(this.processCommands.bind(this, context), true, id)
  }

  protected abstract compile(): Command[]

  protected async processCommands(context: MultiCommandExecutionContext): Promise<any> {
    const remaining = new Set<PendingMessage>(context.compiled.map(compiled => compiled.pendingMessage))
    let logTimeout: Timeout
    await context.compiled.reduce(async (prev, msg) => {
      if (!this.parallel) {
        await prev
      }
      const result = msg.execute()

      result.finally(() => {
        remaining.delete(msg.pendingMessage)
        clearTimeout(logTimeout)
        if (remaining.size) {
          console.debug(`${this.constructor.name}: ${remaining.size} responses remaining`)
          logTimeout = setTimeout(() => {
            console.debug(`${this.constructor.name}: ${remaining.size} responses remaining`, remaining)
          }, 2500)
        } else {
          console.debug(`${this.constructor.name} complete`)
        }
      })

      return result
    }, Promise.resolve())

    return Promise.all(context.compiled.map(msg => msg.pendingMessage)).then(this.parseResponses.bind(this))
  }

  protected parseResponses(responses: ClientMessageResponse[]): any {
    return responses
  }
}

export class PassThroughMultiCommand extends MultiCommand {

  constructor(public readonly cmds: Command[], protected readonly parallel: boolean) {
    super()
  }

  protected compile(): Command[] {
    return this.cmds;
  }
}

export function parallel(...cmds: Command[]): Command {
  return new PassThroughMultiCommand(cmds, true)
}

export function series(...cmds: Command[]): Command {
  return new PassThroughMultiCommand(cmds, false)
}
