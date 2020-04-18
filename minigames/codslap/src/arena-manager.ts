import { Disposable } from '@dandi/common'
import { Inject, Injectable } from '@dandi/core'
import { Command } from '@minecraft/core/command'
import { SubscriptionTracker } from '@minecraft/core/common'
import { Client } from '@minecraft/core/server'
import { forkJoin, from, merge, Observable, of, OperatorFunction } from 'rxjs'
import { concatMap, delay, map, share, switchMap, switchMapTo } from 'rxjs/operators'

import { Arena, ArenaDescriptor } from './arena/arena'
import { CodslapEvents } from './codslap-events'
import { CommonCommands } from './common'

@Injectable()
export class ArenaManager implements Disposable {

  public readonly availableArena$: Observable<Arena>
  public readonly startArena$: Observable<Arena>

  constructor(
    @Inject(Client) private client: Client,
    @Inject(Arena) private arenas: Arena[],
    @Inject(SubscriptionTracker) private readonly subs: SubscriptionTracker,
    @Inject(CommonCommands) private readonly common: CommonCommands,
    @Inject(CodslapEvents) private events$: CodslapEvents,
  ) {
    this.availableArena$ = this.initAvailableArena()
    this.startArena$ = this.initRunArena()

    this.subs.track(this, this.availableArena$.subscribe(this.initArena.bind(this)))
  }

  private initAvailableArena(): Observable<Arena> {
    return merge(...this.arenas.map(arena => {
      const descriptor = arena.constructor as unknown as ArenaDescriptor
      const entryReqs = descriptor.entryRequirements.map(req => req(this.events$))
      const arena$ = new Observable(o => {
        o.next(arena)
        return () => this.subs.release(arena)
      })
      const arenaReq$ = forkJoin(...entryReqs)
      return arena$.pipe(switchMapTo(arenaReq$), map(() => arena))
    })).pipe(share())
  }

  private initRunArena(): Observable<Arena> {
    return this.availableArena$.pipe(
      switchMap(this.initArena.bind(this)),
      concatMap(arena => {
        const descriptor = arena.constructor as unknown as ArenaDescriptor
        const exitReqs = descriptor.exitRequirements.map(req => req(this.events$))
        return forkJoin(...exitReqs).pipe(map(() => arena))
      }),
      switchMap(this.clearArena.bind(this)),
    )
  }

  private initArena(arena: Arena): Observable<Arena> {
    return of(undefined).pipe(
      this.cmdStep(arena.init()),
      delay(1500),
      this.cmdStep(this.common.movePlayersToArena(arena)),
      map(() => arena),
    )
  }

  private clearArena(arena: Arena): Observable<Arena> {
    return of(undefined).pipe(
      delay(1500),
      this.cmdStep(this.common.movePlayersToHolding()),
      delay(1500),
      this.cmdStep(arena.cleanup()),
    )
  }

  public dispose(reason: string): void {
    this.subs.release(this)
  }

  private execute<TResponse>(cmd: Command<TResponse>): Observable<TResponse> {
    return from(cmd.execute(this.client))
  }

  private cmdStep<TResponse>(cmd: Command<TResponse>): OperatorFunction<any, TResponse> {
    return switchMap(() => this.execute(cmd))
  }

}
