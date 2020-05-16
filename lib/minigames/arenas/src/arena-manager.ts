import { Inject, Injectable, Logger, RestrictScope } from '@dandi/core'
import { dequeueReplay, silence } from '@ts-mc/common/rxjs'
import { title } from '@ts-mc/core/cmd'
import { RequestClient } from '@ts-mc/core/client'
import { CommandOperator, CommandOperatorFn } from '@ts-mc/core/command'
import { GameScope, MinigameEvents, EventsAccessor, Accessor } from '@ts-mc/minigames'
import { combineLatest, forkJoin, merge, Observable, of, ReplaySubject, defer, timer } from 'rxjs'
import {
  buffer,
  concatMap,
  finalize,
  map,
  pairwise,
  share,
  startWith,
  switchMap, take,
  tap,
} from 'rxjs/operators'

import { ConfiguredArena, ConfiguredArenas, arenaDescriptor } from './arena'
import { ArenaHooks } from './arena-hook'
import { ArenaRequirement } from './arena-requirement'
import { HookHandler } from './behaviors'
import { CommonCommands } from './common-commands'
import { Players } from '@ts-mc/core/players'

@Injectable(RestrictScope(GameScope))
export class ArenaManager<TEvents extends MinigameEvents> {

  public readonly arenaAvailable$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaComplete$: Observable<ConfiguredArena<TEvents>>

  private readonly arenaStart$$ = new ReplaySubject<ConfiguredArena<TEvents>>(1)
  public readonly arenaStart$ = this.arenaStart$$.asObservable()

  public readonly run$: Observable<any>

  private events: TEvents

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(ConfiguredArenas) private arenas: ConfiguredArena<TEvents>[],
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(EventsAccessor) eventsAccessor: Accessor<TEvents>,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Players) private readonly players: Players,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.logger.debug('ctr')
    this.arenaAvailable$ = this.arenaAvailable()
    this.arenaComplete$ = this.runArenas()
    eventsAccessor(this, 'events')

    this.run$ = this.arenaComplete$
  }

  private arenaAvailable(): Observable<ConfiguredArena<TEvents>> {
    // start with "defer" so that the entry requirements aren't created until the game is started (by subscribing to
    // this observable)
    return defer(() => {
      this.logger.debug('starting arenas', this.arenas.map(arena => arenaDescriptor(arena.instance).title.toString()))
      // this will emit any time an arenas's entry requirements have all been met
      return merge(...this.arenas.map(arena => this.arenaEntryRequirements(arena)))
    }).pipe(
      tap(arena => console.log('arenas available:', arenaDescriptor(arena.instance).title)),
      tap(arena => this.logger.debug('arenas available:', arenaDescriptor(arena.instance).title)),
      dequeueReplay(this.arenaStart$),
      // note: share is not needed here because dequeueReplay effectively accomplishes the same thing
    )
  }

  private runArenas(): Observable<ConfiguredArena<TEvents>> {
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
        return this.initArena([prevArena, arena]).pipe(
          switchMap(() => {
            const prev = prevArena ? arenaDescriptor(prevArena.instance).title : undefined
            console.log('after initArena', { prev, arena: arenaDescriptor(arena.instance).title })
            // set up the arenas's hooks to listen for their server-events
            return merge(
              defer(() => this.initArenaHooks(arena)),
              // emit arenaStart$ - note that this must be emitted AFTER initArenaHooks is subscribed to so that any
              // arenaStart$ behaviors on the newly initialized arenas can receive the event
              defer(() => timer(1)).pipe(
                tap(() => {
                  console.log('arenaStart', arena.instance.constructor.name)
                  this.logger.debug('arenas start', arena.instance.constructor.name)
                  this.arenaStart$$.next(arena)
                }),
                silence,
              ),
            )
          }),
          tap(() => console.log('after initArena/switchMap')),
          // buffer until exit requirements are complete, and at least one new arenas is available
          // this allows the current arenas's hooks to continue receiving server-events until all exit requirements are
          // completed and a new arenas is ready to be started
          buffer(
            combineLatest([
              this.arenaExitRequirements(arena).pipe(tap(() => console.log('GOT EXIT REQUIREMENTS!', arenaDescriptor(arena.instance).title))),
              this.arenaAvailable$.pipe(tap(() => console.log('GOT NEXT AVAILABLE ARENA!', arenaDescriptor(arena.instance).title))),
            ]).pipe(
              tap(() => console.log('buffer emit', arenaDescriptor(arena.instance).title)),
              take(1), // important to avoid re-emitting an already completed arenas
            ),
          ),
          map(() => arena),
        )
      }),
      share(),
      finalize(() => console.log('GAME OVER, MAN')),
    )
  }

  private initArena([prevArena, arena]: [ConfiguredArena<TEvents>, ConfiguredArena<TEvents>]): Observable<ConfiguredArena<TEvents>> {
    const descriptor = arenaDescriptor(arena.instance)
    console.log('initArena', descriptor.title)
    return defer(() => {
      this.logger.debug('initArena', descriptor.title)
      if (prevArena) {
        return this.clearArena(prevArena)
      }
      return of(undefined)
    }).pipe(
      tap(() => console.log('initArena start')),
      this.command(arena.instance.init()),
      // delay(500),
      map(() => this.common.movePlayersToArena(arena.instance)),
      this.command(),
      this.command(title('@a', descriptor.title, descriptor.description)),
      map(() => arena),
      tap(() => console.log('initArena complete', descriptor.title)),
      share(),
      tap(() => console.log('initArena emit', descriptor.title)),
    )
  }

  private initArenaHooks(arena: ConfiguredArena<TEvents>): Observable<any> {
    console.log('initArenaHooks')
    const keys = Object.keys(arena.instance.hooks || {}) as (keyof ArenaHooks<TEvents>)[]
    const hooks = keys.map((hook: keyof ArenaHooks<TEvents>) => {
      const handlers = arena.instance.hooks[hook] as HookHandler<any>[]
      return merge(...handlers.map((handler: HookHandler<any>) => {
        const hook$ = this.events[hook] as unknown as Observable<any>
        return hook$.pipe(
          map(event => {
            this.logger.debug('arenas hook:', arena.constructor.name, hook, handler)
            return handler({ arena: arena.instance, event, players: this.players })
          }),
          this.command(),
        )
      }))
    })
    return merge(...hooks)
  }

  private clearArena(arena: ConfiguredArena<TEvents>): Observable<ConfiguredArena<TEvents>> {
    return defer(() => of(this.common.movePlayersToHolding())).pipe(
      this.command(),
      // delay(500),
      this.command(arena.instance.cleanup()),
    )
  }

  private arenaEntryRequirements(arena: ConfiguredArena<TEvents>): Observable<ConfiguredArena<TEvents>> {
    return this.arenaRequirements(arena, 'entry', arena.instance.entryRequirements)
  }

  private arenaExitRequirements(arena: ConfiguredArena<TEvents>): Observable<ConfiguredArena<TEvents>> {
    return this.arenaRequirements(arena, 'exit', arena.instance.exitRequirements)
  }

  private arenaRequirements(arena: ConfiguredArena<TEvents>, type: 'entry' | 'exit', requirements: ArenaRequirement<TEvents>[]): Observable<ConfiguredArena<TEvents>> {

    console.log('arenaRequirements', arenaDescriptor(arena.instance).title)
    const reqs$ = (requirements || [])
      .concat(arena.config[type])
      .map(req => req(this.events, arena.instance).pipe(
        finalize(() => {
          console.log(`arenaRequirements ${type} req complete`, arenaDescriptor(arena.instance).title)
          this.logger.debug(`${type} req complete`, arena.constructor.name, req)
        })),
        share(),
    )
    return forkJoin(...reqs$).pipe(
      map(() => arena),
      tap(arena => {
        console.log(`arenaRequirements ${type} complete`, arenaDescriptor(arena.instance).title)
        this.logger.debug(`${type} reqs complete`, arena.constructor.name)
      }),
      share(),
    )
  }

}
