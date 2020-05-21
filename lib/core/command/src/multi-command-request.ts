import { Constructor } from '@dandi/common'
import { Logger } from '@dandi/core'
import { forkJoin, interval, merge, Observable, of } from 'rxjs'
import {
  bufferTime,
  concatAll,
  delay,
  filter,
  finalize,
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
  switchMapTo,
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

// const DEBUG_TIMEOUT = 2500
const DEBUG_TIMEOUT = 500

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
    return `${this.constructor.name}#${this.instanceId}${this._debug ? `:${this._debug}`: ''}`
  }

  protected constructor(logger?: Logger, private readonly _debug?: string) {
    super()

    this.logger = logger || loggerFactory.getLogger(this.constructor as Constructor)
  }


  public compileRequest(client: RequestClient): CompiledRequest {
    // console.log(this.constructor.name, 'compileRequest', this.debug)
    const context = new MultiCommandExecutionContext(client, this.compile())
    const id = `${this.constructor.name}#${this.instanceId}`
    return new CompiledSimpleRequest(this.processCommands.bind(this, context), true, this.debug, id, this.logger)
  }

  protected abstract compile(): CommandRequest[]

  protected processCommands(context: MultiCommandExecutionContext): ExecuteResponse<any> {
    // console.log(this.constructor.name, 'processCommands', this.debug)
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
      // tap(() => console.log(this.constructor.name, 'processCommands.complete$', this.debug)),
      switchMap(messages => {
        const execState: CommandExecutionState = { remaining: messages.length }

        // actual processing of request
        const msgState$: Observable<CompletedMessageState> = of(...messages).pipe(

          // IMPORTANT! - Remaining count must be decremented BEFORE concat to ensure it is executed each time an
          //              individual command emits. If it is after, it will only decrement once after concatAll for
          //              series commands.
          tap(() => execState.remaining--),

          this.parallel ? mergeAll() : concatAll(),
          take(messages.length),
          share(),
        )

        const debug$: Observable<any> = msgState$.pipe(
          takeWhile(() => execState.remaining > 0), // IMPORTANT so it stops when there are no more pending request
          tap(() => this.logger.debug(`${this.debug} ${execState.remaining} response(s) remaining`)),
          switchMapTo(interval(DEBUG_TIMEOUT).pipe(
            takeUntil(msgState$),
            switchMapTo(remainingArray$),
            tap(remaining => {
              const detail = remaining.map(msgState => msgState.compiled.debug).join('\n  ')
              this.logger.warn(`${this.debug} ${remaining.length} response(s) remaining:\n  ${detail}`)
            }),
          )),
          filter(() => false),
          finalize(() => this.logger.debug(`${this.debug} complete`))
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
      switchMapTo(remaining$.pipe(
        bufferTime(0),
      )),
    )

    const output$ = complete$.pipe(
      map(msgState => msgState.result),
      toArray(),
      map(this.parseResponses.bind(this)),
      take(1),
      share(),
    )

    const sent$ = forkJoin(context.compiled.map(c => c.sent$))

    // IMPORTANT: return of(output$) for the correct ExecuteResponse
    return Object.assign(of(output$), {
      id: `${this.constructor.name}#${this.instanceId}`,
      sent$, // TODO: emit once for each subcommand? could that mess things up by triggering too many switchMaps?
    })
  }

  protected parseResponses(responses: ClientResponse[]): any {
    return responses
  }
}

export class PassThroughMultiCommand extends MultiCommandRequest {

  constructor(public readonly cmds: CommandRequest[], protected readonly parallel: boolean, debug?: string) {
    super(undefined, debug)
  }

  protected compile(): CommandRequest[] {
    return this.cmds;
  }
}

function passthrough(parallel: boolean, debugOrCmd: string | CommandRequest, cmds: CommandRequest[]): CommandRequest {
  let debug: string
  if (typeof debugOrCmd === 'string') {
    debug = debugOrCmd
  } else {
    cmds.unshift(debugOrCmd)
  }
  // console.log('passthrough', debug, cmds.length)
  return new PassThroughMultiCommand(cmds, parallel, debug)
}

export function parallel(debug?: string, ...cmds: CommandRequest[]): CommandRequest
export function parallel(...cmds: CommandRequest[]): CommandRequest
export function parallel(debugOrCmd: string | CommandRequest, ...cmds: CommandRequest[]): CommandRequest {
  return passthrough(true, debugOrCmd, cmds)
}

export function series(debug?: string, ...cmds: CommandRequest[]): CommandRequest
export function series(...cmds: CommandRequest[]): CommandRequest
export function series(debugOrCmd: string | CommandRequest, ...cmds: CommandRequest[]): CommandRequest {
  return passthrough(false, debugOrCmd, cmds)
}
