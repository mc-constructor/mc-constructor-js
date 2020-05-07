import { Constructor, Uuid } from '@dandi/common'
import { Logger } from '@dandi/core'
import { loggerFactory } from '@ts-mc/common'
import { defer, Observable, timer } from 'rxjs'
import { mapTo, share, shareReplay, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators'

import { CompiledRequest, PendingRequest } from './compiled-request'

export type ExecuteResponse<TResponse> = Observable<Observable<TResponse>>
export type ExecuteFn<TResponse> = () => ExecuteResponse<TResponse>

export class CompiledSimpleRequest<TResponse = any> implements CompiledRequest<TResponse> {

  public readonly id: string | Uuid
  public readonly pendingResponse$: PendingRequest<TResponse>
  public readonly sent$: Observable<this>

  private readonly created: number
  private sent: number
  private response: number

  constructor(
    protected readonly executeFn: ExecuteFn<TResponse>,
    protected readonly hasResponse: boolean | number,
    public readonly debug: string,
    id?: string | Uuid,
    protected logger?: Logger
  ) {
    if (!logger) {
      this.logger = loggerFactory.getLogger(this.constructor as Constructor<CompiledSimpleRequest>)
    }
    this.created = Date.now()
    this.id = id || Uuid.create()

    const sent$ = this.initSent()

    // emit a reference to `this` from the public sent$ so subscribers can identity which message was sent
    this.sent$ = sent$.pipe(mapTo(this))

    const pendingMessage$: Observable<TResponse> = this.initPendingMessage(sent$)

    this.pendingResponse$ = Object.assign(pendingMessage$, {
      id: this.id,
      sent$: this.sent$,
      origin: this.constructor.name,
    })
  }

  protected initSent(): ExecuteResponse<TResponse> {
    return defer(() => this.executeFn()).pipe(
      tap(() => this.sent = Date.now()),
      shareReplay(1),
    )
  }

  protected initPendingMessage(sent$: ExecuteResponse<TResponse>): Observable<TResponse> {
    return sent$.pipe(
      takeWhile(() => this.hasResponse !== false),
      switchMap(response$ => response$),
      typeof this.hasResponse === 'number' ? takeUntil<TResponse>(timer(this.hasResponse)) : tap<TResponse>(),
      tap(() => {
        this.response = Date.now()
        const untilSent = this.sent - this.created
        const sentToResponse = this.response - this.sent
        const totalTime = this.response - this.created
        this.logger.debug(
          `cmd ${this.debug} request stats:\n` +
          `  queued: ${untilSent}ms\n` +
          `  in flight: ${sentToResponse}ms\n` +
          `  total: ${totalTime}ms`
        )
      }),
      share(),
    )
  }

}
