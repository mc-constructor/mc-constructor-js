import { Constructor } from '@dandi/common'
import { Logger } from '@dandi/core'
import { interval, merge, Observable, of } from 'rxjs'
import {
  bufferTime,
  concatAll,
  delay,
  filter,
  map,
  mergeAll,
  mergeMap,
  share,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  toArray,
} from 'rxjs/operators'
import { loggerFactory } from '../../common'
import { dequeueReplay } from '../../common/rxjs'
import {
  Client,
  CompiledMessage,
  CompiledSimpleMessage,
  ClientMessageResponse,
  MessageType,
  PendingMessage,
} from '../../server'

import { Command } from './command'

const DEBUG_TIMEOUT = 2500

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
    interface MessageState {
      compiled: CompiledMessage
    }
    interface CompletedMessageState extends MessageState {
      result: any
    }
    type CompletedMessageState$ = Observable<CompletedMessageState> & MessageState
    interface CommandExecutionState {
      remaining: number
    }

    const source: CompletedMessageState$[] = context.compiled.map(compiled =>
      Object.assign(compiled.pendingMessage$.pipe(
        map(result => ({ compiled, result })),
        share(),
      ), { compiled })
    )

    const source$: Observable<CompletedMessageState$[]> = of(source)

    const complete$: Observable<CompletedMessageState> = source$.pipe(
      switchMap(messages => {
        const execState: CommandExecutionState = { remaining: messages.length }

        // actual processing of messages
        const msgState$: Observable<CompletedMessageState> = of(...messages).pipe(
          this.parallel ? mergeAll() : concatAll(),
          tap(() => execState.remaining--),
          share(),
        )

        const debug$: Observable<any> = msgState$.pipe(
          takeWhile(() => execState.remaining > 0), // IMPORTANT so it stops when there are no more pending messages
          switchMap(() =>
            interval(DEBUG_TIMEOUT).pipe(
              takeUntil(msgState$),
              switchMap(() => remainingArray$),
              tap(remaining => {
                const detail = remaining.map(msgState => msgState.compiled.debug).join('\n  ')
                this.logger.warn(`${remaining.length} responses remaining:\n  ${detail}`)
              })
            )
          ),
          filter(() => false),
        )
        return merge(msgState$, debug$)
      }),
      share(),
    )

    const remaining$ = source$.pipe(
      mergeMap(messages => messages.map(msg => msg)),
      dequeueReplay(complete$, (trigger, event) => trigger.compiled === event.compiled),
    )

    const remainingArray$ = complete$.pipe(
      delay(1), // needs to be delayed by 1 to let the dequeue take effect
      switchMap(() => remaining$.pipe(
        bufferTime(0),
      ))
    )

    const output$ = complete$.pipe(
      map(msgState => msgState.result),
      toArray(),
      map(this.parseResponses.bind(this)),
    )

    return Object.assign(output$, {
      id: `${this.constructor.name}#${this.instanceId}`,
      sent$: undefined,
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
