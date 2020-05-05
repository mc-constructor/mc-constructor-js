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
  take,
  takeUntil,
  takeWhile,
  tap,
  toArray,
} from 'rxjs/operators'

import { loggerFactory } from '@ts-mc/common'
import { dequeueReplay } from '@ts-mc/common/rxjs'
import {
  RequestClient,
  CompiledRequest,
  CompiledSimpleRequest,
  ClientResponse,
  RequestType,
  ExecuteResponse,
} from '@ts-mc/core/client'

import { CommandRequest } from './command-request'

const DEBUG_TIMEOUT = 2500

class MultiCommandExecutionContext {

  public readonly compiled: CompiledRequest[]

  constructor(
    client: RequestClient,
    public readonly cmds: CommandRequest[],
  ) {
    this.compiled = cmds.map(cmd => {
      return cmd.compileRequest(client)
    })
  }

}

export abstract class MultiCommandRequest extends CommandRequest {
  private static nextInstanceId: number = 0

  public readonly type: RequestType = RequestType.cmd
  public readonly instanceId = MultiCommandRequest.nextInstanceId++

  protected abstract readonly parallel: boolean
  protected readonly logger: Logger

  public get debug(): string {
    return `${this.constructor.name}#${this.instanceId}`
  }

  protected constructor(logger?: Logger) {
    super()

    this.logger = logger || loggerFactory.getLogger(this.constructor as Constructor)
  }


  public compileRequest(client: RequestClient): CompiledRequest {
    const context = new MultiCommandExecutionContext(client, this.compile())
    const id = `${this.constructor.name}#${this.instanceId}`
    return new CompiledSimpleRequest(this.processCommands.bind(this, context), true, id)
  }

  protected abstract compile(): CommandRequest[]

  protected processCommands(context: MultiCommandExecutionContext): ExecuteResponse<any> {
    interface MessageState {
      compiled: CompiledRequest
    }
    interface CompletedMessageState extends MessageState {
      result: any
    }
    type CompletedMessageState$ = Observable<CompletedMessageState> & MessageState
    interface CommandExecutionState {
      remaining: number
    }

    const source: CompletedMessageState$[] = context.compiled.map(compiled =>
      Object.assign(compiled.pendingResponse$.pipe(
        map(result => ({ compiled, result })),
        share(),
      ), { compiled })
    )

    const source$: Observable<CompletedMessageState$[]> = of(source)

    const complete$: Observable<CompletedMessageState> = source$.pipe(
      switchMap(messages => {
        const execState: CommandExecutionState = { remaining: messages.length }

        // actual processing of request
        const msgState$: Observable<CompletedMessageState> = of(...messages).pipe(
          this.parallel ? mergeAll() : concatAll(),
          tap(() => execState.remaining--),
          take(messages.length),
          share(),
        )

        const debug$: Observable<any> = msgState$.pipe(
          takeWhile(() => execState.remaining > 0), // IMPORTANT so it stops when there are no more pending request
          tap(() => this.logger.debug(`${execState.remaining} responses remaining`)),
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

    // IMPORTANT: return of(output$) for the correct ExecuteResponse
    return Object.assign(of(output$), {
      id: `${this.constructor.name}#${this.instanceId}`,
      sent$: undefined, // TODO: emit once for each subcommand? could that mess things up by triggering too many switchMaps?
    })
  }

  protected parseResponses(responses: ClientResponse[]): any {
    return responses
  }
}

export class PassThroughMultiCommand extends MultiCommandRequest {

  constructor(public readonly cmds: CommandRequest[], protected readonly parallel: boolean) {
    super()
  }

  protected compile(): CommandRequest[] {
    return this.cmds;
  }
}

export function parallel(...cmds: CommandRequest[]): CommandRequest {
  return new PassThroughMultiCommand(cmds, true)
}

export function series(...cmds: CommandRequest[]): CommandRequest {
  return new PassThroughMultiCommand(cmds, false)
}
