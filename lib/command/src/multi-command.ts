import { Constructor } from '@dandi/common'
import { Logger } from '@dandi/core'
import { loggerFactory } from '../../common'
import {
  Client,
  CompiledMessage,
  CompiledSimpleMessage,
  ClientMessageResponse,
  MessageType, PendingMessage,
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
  protected readonly logger: Logger

  public get debug(): string {
    return `${this.constructor.name}#${this.instanceId}`
  }

  protected constructor(logger?: Logger) {
    super()

    this.logger = logger || loggerFactory.getLogger(this.constructor as Constructor)
  }


  public compileMessage(client: Client): CompiledMessage {
    const context = new MultiCommandExecutionContext(client, this.compile())
    const id = `${this.constructor.name}#${this.instanceId}`
    return new CompiledSimpleMessage(this.processCommands.bind(this, context), true, id)
  }

  protected abstract compile(): Command[]

  protected processCommands(context: MultiCommandExecutionContext): PendingMessage {
    const remaining = new Set<CompiledMessage>(context.compiled.map(compiled => compiled))
    let logTimeout: Timeout
    context.compiled.reduce(async (prev, msg) => {
      if (!this.parallel) {
        await prev
      }
      const result = msg.execute()
      let notified = false

      result.finally(() => {
        remaining.delete(msg)
        clearInterval(logTimeout)
        if (remaining.size) {
          this.logger.debug(`${this.constructor.name}: ${remaining.size} responses remaining`)
          logTimeout = setInterval(() => {
            this.logger.info(`${this.constructor.name}: ${remaining.size} responses remaining:\n  `,
              [...remaining].map(msg => msg.debug).join('\n  '))
            notified = true
          }, 2500)
        } else {
          const level = notified ? 'info' : 'debug'
          this.logger[level](`${this.constructor.name} complete`)
        }
      })

      return result
    }, Promise.resolve())

    const result = Promise.all(context.compiled.map(msg => msg.pendingMessage)).then(this.parseResponses.bind(this))
    return Object.assign(result, {
      id: `${this.constructor.name}#${this.instanceId}`,
      sent: undefined,
    })
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
