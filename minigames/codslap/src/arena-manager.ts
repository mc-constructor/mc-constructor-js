import { Inject, Injectable, Logger } from '@dandi/core'
import { title } from '@minecraft/core/cmd'
import { CommandOperator, CommandOperatorFn, dequeueReplay } from '@minecraft/core/common/rxjs'
import { Client } from '@minecraft/core/server'
import { combineLatest, forkJoin, merge, Observable, of, ReplaySubject } from 'rxjs'
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

import { Arena, arenaDescriptor, ArenaHooks, ArenaRequirement } from './arena/arena'
import { CodslapEvents } from './codslap-events'
import { CommonCommands } from './common'
import { Accessor, EventsAccessor } from './events-accessor'
import { HookHandler } from './hooks'

@Injectable()
export class ArenaManager {

  public readonly arenaAvailable$: Observable<Arena>
  public readonly arenaComplete$: Observable<Arena>

  private readonly arenaStart$$ = new ReplaySubject<Arena>(1)
  public readonly arenaStart$ = this.arenaStart$$.asObservable()

  public readonly run$: Observable<any>

  private events: CodslapEvents

  constructor(
    @Inject(Client) private client: Client,
    @Inject(Arena) private arenas: Arena[],
    @Inject(EventsAccessor) eventsAccessor: Accessor<CodslapEvents>,
    @Inject(CommonCommands) private readonly common: CommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.logger.debug('ctr')
    this.arenaAvailable$ = this.arenaAvailable()
    this.arenaComplete$ = this.runArenas()
    eventsAccessor(this, 'events')

    this.run$ = this.arenaComplete$
  }

  private arenaAvailable(): Observable<Arena> {
    // start with "of" so that the entry requirements aren't created until a subscription actually happens
    return of(undefined).pipe(
      tap(() => this.logger.debug('starting arenas', this.arenas.map(arena => arenaDescriptor(arena).title.toString()))),
      // this will emit any time an arena's entry requirements have all been met
      switchMap(() => merge(...this.arenas.map(arena => this.arenaEntryRequirements(arena)))),
      tap(arena => this.logger.debug('arena available:', arena.constructor.name)),
      dequeueReplay(this.arenaStart$),
    )
  }

  private runArenas(): Observable<Arena> {
    return this.arenaAvailable$.pipe(
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
                setTimeout(() => {
                  this.logger.debug('arena start', arena.constructor.name)
                  this.arenaStart$$.next(arena)
                }, 1)
              }),
              switchMap(() => this.initArenaHooks(arena)),

              // buffer until exit requirements are complete, and at least one new arena is available
              // this allows the current arena's hooks to continue receiving events until all exit requirements are
              // completed and a new arena is ready to be started
              buffer(
                combineLatest([
                  this.arenaExitRequirements(arena),
                  this.arenaAvailable$,
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
    this.logger.debug('initArena', arena.constructor.name)
    const descriptor = arenaDescriptor(arena)
    return of(undefined).pipe(
      switchMap(() => {
        if (prevArena) {
          return this.clearArena(prevArena)
        }
        return of(undefined)
      }),
      this.command(arena.init()),
      delay(500),
      this.command(this.common.movePlayersToArena(arena)),
      this.command(title('@a', descriptor.title, descriptor.description)),
      map(() => arena),
      tap(arena => this.logger.debug('initArena complete', arena.constructor.name)),
    )
  }

  private initArenaHooks(arena: Arena): Observable<any> {
    const hooks = [...Object.keys(arena.hooks)].map((hook: keyof ArenaHooks) => {
      const handlers = arena.hooks[hook] as HookHandler<any>[]
      return merge(...handlers.map((handler: HookHandler<any>) => {
        const hook$ = this.events[hook] as Observable<any>
        return hook$.pipe(tap(event => {
          this.logger.debug('arena hook:', arena.constructor.name, hook, handler)
          const cmd = handler(arena, event)
          cmd.execute(this.client)
        }))
      }))
    })
    return merge(...hooks)
  }

  private clearArena(arena: Arena): Observable<Arena> {
    return of(undefined).pipe(
      this.command(this.common.movePlayersToHolding()),
      delay(500),
      this.command(arena.cleanup()),
    )
  }

  private arenaEntryRequirements(arena: Arena): Observable<any> {
    return this.arenaRequirements(arena, 'entry', arenaDescriptor(arena).entryRequirements)
  }

  private arenaExitRequirements(arena: Arena): Observable<any> {
    return this.arenaRequirements(arena, 'exit', arenaDescriptor(arena).exitRequirements)
  }

  private arenaRequirements(arena: Arena, type: string, requirements: ArenaRequirement[]): Observable<any> {
    const reqs$ = requirements.map(req => req(this.events, arena).pipe(
      finalize(() => this.logger.debug(`${type} req complete`, arena.constructor.name, req))),
    )
    return forkJoin(...reqs$).pipe(
      map(() => arena),
      tap(arena => this.logger.debug(`${type} reqs complete`, arena.constructor.name)),
      share(),
    )
  }

}
