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
        const result = await context.executeMessage(msg)
        // console.log('RESULT?', result)
      }
    })

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
