import { Inject, Injectable, Logger, RestrictScope } from '@dandi/core'
import { dequeueReplay, pass, silence } from '@ts-mc/common/rxjs'
import { text, title } from '@ts-mc/core/cmd'
import { RequestClient } from '@ts-mc/core/client'
import { MapCommand, MapCommandOperatorFn, CommandStatic, CommandStaticFn } from '@ts-mc/core/command'
import { GameScope, MinigameEvents } from '@ts-mc/minigames'
import { HookHandler, Hooks, HookSource } from '@ts-mc/minigames/behaviors'
import { combineLatest, defer, forkJoin, merge, Observable, of, ReplaySubject, timer, NEVER } from 'rxjs'
import {
  buffer,
  concatMap,
  delay,
  filter,
  finalize,
  map,
  mapTo,
  pairwise,
  share,
  shareReplay,
  startWith,
  switchMap,
  switchMapTo,
  take,
  tap,
} from 'rxjs/operators'

import { ConfiguredArena, ConfiguredArenas } from './arena'
import { ArenaManagerEventsProxy } from './arena-manager-events-proxy'
import { ArenaRequirement } from './arena-requirement'
import { CommonCommands } from './common-commands'

export interface ArenaManager<TEvents extends MinigameEvents> {
  readonly arenaAvailable$: Observable<ConfiguredArena<TEvents>>
  readonly arenaComplete$: Observable<ConfiguredArena<TEvents>>
  readonly arenaInit$: Observable<ConfiguredArena<TEvents>>
  readonly arenaStart$: Observable<ConfiguredArena<TEvents>>
  readonly pendingArenas$: Observable<Set<ConfiguredArena<TEvents>>>
  readonly lastArena$: Observable<void>
  readonly run$: Observable<any>
}

@Injectable(RestrictScope(GameScope))
class ArenaManagerImpl<TEvents extends MinigameEvents> implements ArenaManager<TEvents>{

  public readonly arenaAvailable$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaComplete$: Observable<ConfiguredArena<TEvents>>
  public readonly pendingArenas$: Observable<Set<ConfiguredArena<TEvents>>>
  public readonly lastArena$: Observable<void>

  private readonly arenaInit$$ = new ReplaySubject<ConfiguredArena<TEvents>>(1)
  public readonly arenaInit$ = this.arenaInit$$.asObservable()

  private readonly arenaStart$$ = new ReplaySubject<ConfiguredArena<TEvents>>(1)
  public readonly arenaStart$ = this.arenaStart$$.asObservable()

  public readonly run$: Observable<any>

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(ConfiguredArenas) private arenas: ConfiguredArena<TEvents>[],
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(MinigameEvents) private readonly events: TEvents,
    @Inject(ArenaManagerEventsProxy) private readonly eventsProxy: ArenaManagerEventsProxy<TEvents>,
    @Inject(MapCommand) private readonly mapCommand: MapCommandOperatorFn,
    @Inject(CommandStatic) private readonly command: CommandStaticFn,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.logger.debug('ctr')
    this.arenaAvailable$ = this.arenaAvailable()
    this.arenaComplete$ = this.runArenas()
    this.pendingArenas$ = this.initPendingArenas()
    this.lastArena$ = this.initLastArena()

    this.run$ = this.arenaComplete$

    this.eventsProxy.init(this)
  }

  private arenaAvailable(): Observable<ConfiguredArena<TEvents>> {
    // start with "defer" so that the entry requirements aren't created until the game is started (by subscribing to
    // this observable)
    return defer(() => {
      this.logger.debug('starting arena', this.arenas.map(arena => arena.title.toString()))
      // this will emit any time an arenas's entry requirements have all been met
      return merge(...this.arenas.map(arena => this.arenaEntryRequirements(arena)))
    }).pipe(
      tap(arena => console.log('arena available:', arena.title)),
      tap(arena => this.logger.debug('arena available:', arena.title)),
      dequeueReplay(this.arenaInit$),
      // note: share is not needed here because dequeueReplay effectively accomplishes the same thing
    )
  }

  private runArenas(): Observable<ConfiguredArena<TEvents>> {
    console.log('runArenas')
    return this.arenaAvailable$.pipe(
      // Use pairwise so the previous arenas is emitted, allowing the arenas switching / cleanup logic to be triggered
      // once the next arenas is ready. Use startWith so that the first arenas emits with no previous arenas.
      startWith(undefined as ConfiguredArena<TEvents>),
      pairwise(),

      // Use concatMap to effectively buffer available arenas as they are emitted while the current arenas is still
      // being played. It will not continue until its inner Observable emits, which allows arenas to be played until
      // their exit requirements are met, even when one or more new arenas have become available (emitted from
      // arenaAvailable$)
      concatMap(([prevArena, arena]) => {
        console.log('in concatMap')
        // set up the new arenas (includes moving players into it once it's done)
        return this.initArena(prevArena, arena).pipe(
          switchMap(() => {
            const prev = prevArena ? prevArena.title : undefined
            console.log('after initArena', { prev, arena: arena.title })
            // set up the arenas's hooks to listen for their server-events
            return merge(
              defer(() => this.initArenaHooks(arena)),
              // emit arenaStart$ - note that this must be emitted AFTER initArenaHooks is subscribed to so that any
              // arenaStart$ behaviors on the newly initialized arenas can receive the event
              defer(() => timer(1)).pipe(
                tap(() => {
                  console.log('arenaStart', arena.title)
                  this.logger.debug('arena start', arena.title)
                  this.arenaStart$$.next(arena)
                }),
                silence,
              ),
            )
          }),
          // buffer until exit requirements are complete, and at least one new arena is available
          // this allows the current arena's hooks to continue receiving server-events until all exit requirements are
          // completed and a new arena is ready to be started
          buffer(
            combineLatest([
              this.arenaExitRequirements(arena).pipe(tap(() => console.log('GOT EXIT REQUIREMENTS!', arena.title))),
              this.arenaAvailable$.pipe(
                // this is complicated for now - since arenaStart doesn't get emitted until after a delay (see above),
                // arenaAvailable$ immediately emits an event for the current arena. if it is not filtered out, the
                // arena will responding to event hooks after its exit requirements are met until the REAL next arena
                // becomes available
                filter(nextArena => nextArena !== arena),
                tap(nextArena => console.log('GOT NEXT AVAILABLE ARENA!', nextArena.title)),
              ),
            ]).pipe(
              tap(() => console.log('buffer emit', arena.title)),
            ),
          ),

          // important to avoid re-emitting an already completed arenas
          take(1),
          mapTo(arena),
        )
      }),
      share(),
      finalize(() => console.log('GAME OVER, MAN')),
    )
  }

  private initArena(
    prevArena: ConfiguredArena<TEvents>,
    arena: ConfiguredArena<TEvents>,
  ): Observable<ConfiguredArena<TEvents>> {
    console.log('initArena', arena.title)
    return defer(() => this.clearArena(prevArena, arena)).pipe(
      tap(() => console.log('initArena start')),
      this.mapCommand(arena.instance.init()),
      delay(2500),
      this.mapCommand(() => this.common.movePlayersToArena(this.events.players, arena.instance)),
      this.mapCommand(title('@a', arena.title, arena.description)),
      map(() => {
        console.log('initArena complete', arena.title)
        this.arenaInit$$.next(arena)
        return arena
      }),
      share(),
    )
  }

  private initArenaHooks(arena: ConfiguredArena<TEvents>): Observable<any> {
    console.log('initArenaHooks')
    const keys = Object.keys(arena.instance.hooks || {}) as (keyof Hooks<TEvents>)[]
    if (!keys.length) {
      // even if there are no hooks, *something* must be returned in order to keep the arena running
      return NEVER
    }
    const hookSource: HookSource<TEvents> = this.events as unknown as HookSource<TEvents>
    const hooks = keys.map((hook: keyof HookSource<TEvents>) => {
      const handlers = arena.instance.hooks[hook] as HookHandler<TEvents>[]
      return merge(...handlers.map((handler: HookHandler<TEvents>) => {
        const hook$ = hookSource[hook]
        const switchMapOp = switchMap(event => {
          if (handler.triggerFilter) {
            return handler.triggerFilter().pipe(
              take(1),
              filter(result => result),
              mapTo(event)
            )
          }
          return of(event)
        })
        return hook$.pipe(
          switchMapOp,
          this.mapCommand(event => {
            this.logger.debug('arena hook:', arena.title, hook)
            return handler({ getRandomSpawn: () => arena.instance.getRandomSpawn(), event, events: this.events })
          }),
        )
      }))
    })
    return merge(...hooks)
  }

  private clearArena(arena: ConfiguredArena<TEvents>, nextArena: ConfiguredArena<TEvents>): Observable<ConfiguredArena<TEvents>> {
    return defer(() => {
      console.log('in clearArena')
      if (!arena) {
        return of(undefined)
      }
      return this.command(title('@a', text('Coming up...'), nextArena.title)).pipe(
        delay(5000),
      )
    }).pipe(
      switchMapTo(this.events.players$.pipe(take(1))),
      this.mapCommand(players => this.common.movePlayersToHolding(players)),
      delay(500),
      arena ? this.mapCommand(arena.instance.cleanup()) : pass,
    )
  }

  private arenaEntryRequirements(arena: ConfiguredArena<TEvents>): Observable<ConfiguredArena<TEvents>> {
    return this.arenaRequirements(arena, 'entry', arena.instance.entryRequirements)
  }

  private arenaExitRequirements(arena: ConfiguredArena<TEvents>): Observable<ConfiguredArena<TEvents>> {
    return this.arenaRequirements(arena, 'exit', arena.instance.exitRequirements)
  }

  private arenaRequirements(arena: ConfiguredArena<TEvents>, type: 'entry' | 'exit', requirements: ArenaRequirement<TEvents>[]): Observable<ConfiguredArena<TEvents>> {
    console.log('arenaRequirements', type, 'for', arena.title)
    const reqs$ = (requirements || [])
      .concat(arena.config[type])
      .map(req => req(this.events, arena.instance).pipe(
        tap(() => {
          console.log(`arenaRequirements ${type} req complete`, arena.title)
          this.logger.debug(`${type} req complete`, arena.title, req)
        }, err => {
          console.error(err)
          this.logger.error(`${type} req error`, err)
        }),
      ),
      share(),
    )
    return forkJoin(...reqs$).pipe(
      mapTo(arena),
      tap(arena => {
        console.log(`arenaRequirements ${type} all complete`, arena.title)
        this.logger.debug(`${type} reqs complete`, arena.title)
      }),
      share(),
    )
  }

  private initPendingArenas(): Observable<Set<ConfiguredArena<TEvents>>> {
    return of(new Set(this.arenas)).pipe(
      switchMap(pendingArenas => this.arenaStart$.pipe(
        map(arena => {
          pendingArenas.delete(arena)
          return new Set(pendingArenas)
        }),
      )),
      shareReplay(1),
    )
  }

  private initLastArena(): Observable<void> {
    return this.pendingArenas$.pipe(
      filter(pendingArenas => pendingArenas.size === 0),
      mapTo(undefined),
    )
  }

}

export const ArenaManager = ArenaManagerImpl
