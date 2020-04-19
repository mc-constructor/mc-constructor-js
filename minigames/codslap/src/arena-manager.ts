import { Inject, Injectable } from '@dandi/core'
import { title } from '@minecraft/core/cmd'
import { Command } from '@minecraft/core/command'
import { Client } from '@minecraft/core/server'
import { combineLatest, forkJoin, from, merge, Observable, of, OperatorFunction, Subject } from 'rxjs'
import {
  buffer,
  concatMap,
  delay,
  finalize,
  map,
  pairwise,
  share,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators'

import { Arena, arenaDescriptor, ArenaRequirement } from './arena/arena'
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
    @Inject(EventsAccessor) eventsAccessor: Accessor<CodslapEvents>,
    @Inject(CommonCommands) private readonly common: CommonCommands,
  ) {
    this.availableArena$ = this.availableArena()
    this.runArena$ = this.runArena()
    eventsAccessor(this, 'events')

    this.run$ = this.runArena$
  }

  private availableArena(): Observable<Arena> {
    // start with "of" so that the entry requirements aren't created until a subscription actually happens
    return of([]).pipe(
      // this will emit any time an arena's entry requirements have all been met
      switchMap(() => merge(...this.arenas.map(arena => this.arenaEntryRequirements(arena)))),
      tap(arena => console.log('ARENA AVAILABLE', arena.constructor.name)),
      share(),
    )
  }

  private runArena(): Observable<Arena> {
    return this.availableArena$.pipe(
      // Use pairwise so the previous arena is emitted, allowing the arena switching / cleanup logic to be triggered
      // once the next arena is ready. Use startWith so that the first arena emits with no previous arena.
      startWith(undefined as Arena),
      pairwise(),

      // Use concatMap to effectively buffer available arenas as they are emitted while the current arena is still
      // being played. It will not continue until its inner Observable emits, which allows arenas to be played until
      // their exit requirements are met.
      concatMap(([prevArena, arena]) => {
        // set up the new arena (includes moving players into it once it's done)
        return this.initArena([prevArena, arena]).pipe(
          switchMap(() => {
            // set up the arena's hooks to listen for their events
            return of(undefined).pipe(
              // emit arenaStart$ - note that this must come AFTER initArenaHooks so that any arenaStart$ behaviors on the
              // newly initialized arena can receive the event
              tap(() => {
                console.log('arena start', arena.constructor.name)
                setTimeout(() => this.arenaStart$$.next(arena), 10)
              }),
              switchMap(() => this.initArenaHooks(arena)),

              // buffer until exit requirements are complete, and at least one new arena is available
              // this allows the current arena's hooks to continue receiving events until all exit requirements are
              // completed and a new arena is ready to be started
              buffer(
                combineLatest([
                  this.arenaExitRequirements(arena),
                  this.availableArena$,
                ]),
              ),
            )
          }),
          map(() => arena),
        )
      }),
      share(),
    )
  }

  private initArena([prevArena, arena]: [Arena, Arena]): Observable<Arena> {
    console.log('initArena', arena.constructor.name)
    const descriptor = arenaDescriptor(arena)
    return of(undefined).pipe(
      switchMap(() => {
        if (prevArena) {
          return this.clearArena(prevArena)
        }
        return of(undefined)
      }),
      this.cmdStep(arena.init()),
      delay(500),
      this.cmdStep(this.common.movePlayersToArena(arena)),
      this.cmdStep(title('@a', descriptor.title, descriptor.description)),
      map(() => arena),
      tap(arena => console.log('initArena complete', arena.constructor.name)),
    )
  }

  private initArenaHooks(arena: Arena): Observable<any> {
    console.log('initArenaHooks', arena.constructor.name)
    const events$ = this.events
    const hooks = [...Object.keys(arena.hooks)].map(hook => {
      const handlers = arena.hooks[hook]
      return merge(...handlers.map((handler: HookHandler<any>) => {
        return events$[hook].pipe(tap(event => {
          console.log('arena hook:', arena.constructor.name, hook, handler)
          const cmd = handler(arena, event)
          cmd.execute(this.client)
        }))
      }))
    })
    return merge(...hooks)
  }

  private clearArena(arena: Arena): Observable<Arena> {
    return of(undefined).pipe(
      this.cmdStep(this.common.movePlayersToHolding()),
      delay(500),
      this.cmdStep(arena.cleanup()),
    )
  }

  private arenaEntryRequirements(arena: Arena): Observable<any> {
    return this.arenaRequirements(arena, 'entry', arenaDescriptor(arena).entryRequirements)
  }

  private arenaExitRequirements(arena: Arena): Observable<any> {
    return this.arenaRequirements(arena, 'exit', arenaDescriptor(arena).exitRequirements)
  }

  private arenaRequirements(arena: Arena, type: string, requirements: ArenaRequirement[]): Observable<any> {
    const reqs$ = requirements.map(req => req(this.events).pipe(
      finalize(() => console.log(`${type} req complete`, arena.constructor.name, req))),
    )
    return forkJoin(...reqs$).pipe(map(() => arena))
  }

  private execute<TResponse>(cmd: Command<TResponse>): Observable<TResponse> {
    return from(cmd.execute(this.client))
  }

  private cmdStep<TResponse>(cmd: Command<TResponse>): OperatorFunction<any, TResponse> {
    return switchMap(() => this.execute(cmd))
  }

}
