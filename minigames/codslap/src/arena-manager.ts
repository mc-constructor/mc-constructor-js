import { Inject, Injectable } from '@dandi/core'
import { Command } from '@minecraft/core/command'
import { SubscriptionTracker } from '@minecraft/core/common'
import { Client } from '@minecraft/core/server'
import { forkJoin, from, merge, Observable, of, OperatorFunction, Subject } from 'rxjs'
import {
  concatMap,
  delay,
  finalize,
  map,
  pairwise,
  share,
  startWith,
  switchMap,
  switchMapTo,
  tap
} from 'rxjs/operators'

import { Arena, ArenaDescriptor } from './arena/arena'
import { CodslapEvents } from './codslap-events'
import { CommonCommands } from './common'
import { Accessor, EventsAccessor } from './events-accessor'
import { HookHandler } from './hooks'

@Injectable()
export class ArenaManager {

  public readonly availableArena$: Observable<Arena>
  public readonly runArena$: Observable<Arena>

  private readonly arenaStart$$ = new Subject<Arena>()
  public readonly arenaStart$ = this.arenaStart$$.asObservable()

  public readonly run$: Observable<any>

  private events: CodslapEvents

  constructor(
    @Inject(Client) private client: Client,
    @Inject(Arena) private arenas: Arena[],
    @Inject(SubscriptionTracker) private readonly subs: SubscriptionTracker,
    @Inject(EventsAccessor) eventsAccessor: Accessor<CodslapEvents>,
    @Inject(CommonCommands) private readonly common: CommonCommands,
  ) {
    this.availableArena$ = this.availableArena()
    this.runArena$ = this.runArena()
    eventsAccessor(this, 'events')

    this.run$ = this.runArena$
  }

  private availableArena(): Observable<Arena> {
    return of([]).pipe(
      switchMap(() => merge(...this.arenas.map(arena => {
        const descriptor = arena.constructor as unknown as ArenaDescriptor
        const entryReqs = descriptor.entryRequirements.map(req =>
          req(this.events).pipe(finalize(() => console.log('entry req complete', arena.constructor.name, req))))
        const arena$ = new Observable(o => {
          o.next(arena)
          return () => this.subs.release(arena as any)
        })
        const arenaReq$ = forkJoin(...entryReqs)
        return arena$.pipe(switchMapTo(arenaReq$), map(() => arena))
      }))),
      tap(arena => console.log('ARENA AVAILABLE', arena.constructor.name)),
      share(),
    )
  }

  private runArena(): Observable<Arena> {
    return this.availableArena$.pipe(
      startWith(undefined as Arena),
      pairwise(),
      concatMap(([prevArena, arena]) => {
        const descriptor = arena.constructor as unknown as ArenaDescriptor
        return this.initArena([prevArena, arena]).pipe(
          tap(() => {
            this.initArenaHooks(arena)
            this.arenaStart$$.next(arena)
          }),
          switchMap(() => {
            const exitReqs = descriptor.exitRequirements.map(req =>
              req(this.events).pipe(finalize(() => console.log('exit req complete', arena.constructor.name, req)))
            )
            return forkJoin(...exitReqs).pipe(map(() => arena))
          })
        )
      }),
      share(),
    )
  }

  private initArena([prevArena, arena]: [Arena, Arena]): Observable<Arena> {
    console.log('initArena', arena.constructor.name)
    return of(undefined).pipe(
      switchMap(() => {
        if (prevArena) {
          return this.clearArena(prevArena)
        }
        return of(undefined)
      }),
      this.cmdStep(arena.init()),
      delay(1500),
      this.cmdStep(this.common.movePlayersToArena(arena)),
      map(() => arena),
      tap(arena => console.log('initArena complete', arena.constructor.name)),
    )
  }

  private initArenaHooks(arena: Arena) {
    console.log('initArenaHooks', arena.constructor.name)
    const events$ = this.events
    for (const [hook, handlers] of Object.entries(arena.hooks)) {
      handlers.forEach((handler: HookHandler<any>) => {
        console.log('binding handler for', arena.constructor.name, hook)
        this.subs.track(arena as any, events$[hook].subscribe(event => {
          const cmd = handler(arena, event)
          cmd.execute(this.client)
        }))
      })
    }
  }

  private clearArena(arena: Arena): Observable<Arena> {
    return of(undefined).pipe(
      delay(1500),
      this.cmdStep(this.common.movePlayersToHolding()),
      delay(1500),
      this.cmdStep(arena.cleanup()),
    )
  }

  private execute<TResponse>(cmd: Command<TResponse>): Observable<TResponse> {
    return from(cmd.execute(this.client))
  }

  private cmdStep<TResponse>(cmd: Command<TResponse>): OperatorFunction<any, TResponse> {
    return switchMap(() => this.execute(cmd))
  }

}
