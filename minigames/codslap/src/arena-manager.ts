import { Inject, Injectable, Logger } from '@dandi/core'
import { title } from '@minecraft/core/cmd'
import { CommandOperator, CommandOperatorFn, dequeueReplay } from '@minecraft/core/common/rxjs'
import { Client } from '@minecraft/core/server'
import { combineLatest, forkJoin, merge, Observable, of, ReplaySubject, defer, timer } from 'rxjs'
import {
  buffer,
  concatMap,
  finalize,
  map,
  pairwise,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators'

import { arenaDescriptor, ArenaHooks, ArenaRequirement, ConfiguredArena, ConfiguredArenas } from './arena'
import { CodslapEvents } from './codslap-events'
import { CommonCommands } from './common'
import { Accessor, EventsAccessor } from './events-accessor'
import { HookHandler } from './hooks'

@Injectable()
export class ArenaManager {

  public readonly arenaAvailable$: Observable<ConfiguredArena>
  public readonly arenaComplete$: Observable<ConfiguredArena>

  private readonly arenaStart$$ = new ReplaySubject<ConfiguredArena>(1)
  public readonly arenaStart$ = this.arenaStart$$.asObservable()

  public readonly run$: Observable<any>

  private events: CodslapEvents

  constructor(
    @Inject(Client) private client: Client,
    @Inject(ConfiguredArenas) private arenas: ConfiguredArena[],
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

  private arenaAvailable(): Observable<ConfiguredArena> {
    console.log('arenaAvailable')
    // start with "defer" so that the entry requirements aren't created until the game is started (by subscribing to
    // this observable)
    return defer(() => {
      console.log('arenaAvailable defer')
      this.logger.debug('starting arenas', this.arenas.map(arena => arenaDescriptor(arena.instance).title.toString()))
      // this will emit any time an arena's entry requirements have all been met
      return merge(...this.arenas.map(arena => this.arenaEntryRequirements(arena)))
    }).pipe(
      tap(arena => this.logger.debug('arena available:', arenaDescriptor(arena.instance).title)),
      dequeueReplay(this.arenaStart$),
      // note: share is not needed here because dequeueReplay effectively accomplishes the same thing
    )
  }

  private runArenas(): Observable<ConfiguredArena> {
    return this.arenaAvailable$.pipe(
      // Use pairwise so the previous arena is emitted, allowing the arena switching / cleanup logic to be triggered
      // once the next arena is ready. Use startWith so that the first arena emits with no previous arena.
      startWith(undefined as ConfiguredArena),
      pairwise(),

      // Use concatMap to effectively buffer available arenas as they are emitted while the current arena is still
      // being played. It will not continue until its inner Observable emits, which allows arenas to be played until
      // their exit requirements are met, even when one or more new arenas have become available (emitted from
      // arenaAvailable$)
      concatMap(([prevArena, arena]) => {
        console.log('in concatMap')
        // set up the new arena (includes moving players into it once it's done)
        return this.initArena([prevArena, arena]).pipe(
          switchMap(() => {
            const prev = prevArena ? arenaDescriptor(prevArena.instance).title : undefined
            console.log('after initArena', { prev, arena: arenaDescriptor(arena.instance).title })
            // set up the arena's hooks to listen for their events
            return merge(
              defer(() => this.initArenaHooks(arena)),
              // emit arenaStart$ - note that this must be emitted AFTER initArenaHooks is subscribed to so that any
              // arenaStart$ behaviors on the newly initialized arena can receive the event
              defer(() => timer(1)).pipe(
                tap(() => {
                  console.log('arenaStart', arena.instance.constructor.name)
                  this.logger.debug('arena start', arena.instance.constructor.name)
                  this.arenaStart$$.next(arena)
                }),
              ),
            )
          }),
          tap(() => console.log('after initArena/switchMap')),
          // buffer until exit requirements are complete, and at least one new arena is available
          // this allows the current arena's hooks to continue receiving events until all exit requirements are
          // completed and a new arena is ready to be started
          buffer(
            combineLatest([
              this.arenaExitRequirements(arena),
              this.arenaAvailable$,
            ]),
          ),
          map(() => arena),
        )
      }),
      share(),
    )
  }

  private initArena([prevArena, arena]: [ConfiguredArena, ConfiguredArena]): Observable<ConfiguredArena> {
    const descriptor = arenaDescriptor(arena.instance)
    console.log('initArena', descriptor.title)
    return defer(() => {
      console.log('initArena.defer', descriptor.title)
      this.logger.debug('initArena', descriptor.title)
      if (prevArena) {
        return this.clearArena(prevArena)
      }
      return of(undefined)
    }).pipe(
      tap(() => console.log('initArena start')),
      this.command(arena.instance.init()),
      // delay(500),
      this.command(this.common.movePlayersToArena(arena.instance)),
      this.command(title('@a', descriptor.title, descriptor.description)),
      tap(v => console.log('initArena after CMD', v)),
      // tap(() => console.log('initArena after move players and title command')),
      map(() => arena),
      // tap(() => this.logger.debug('initArena complete', descriptor.title)),
      tap(() => console.log('initArena complete', descriptor.title)),
      share(),
      tap(() => console.log('initArena emit', descriptor.title)),
    )
  }

  private initArenaHooks(arena: ConfiguredArena): Observable<any> {
    console.log('initArenaHooks')
    const hooks = [...Object.keys(arena.instance.hooks || {})].map((hook: keyof ArenaHooks) => {
      const handlers = arena.instance.hooks[hook] as HookHandler<any>[]
      return merge(...handlers.map((handler: HookHandler<any>) => {
        const hook$ = this.events[hook] as Observable<any>
        return hook$.pipe(tap(event => {
          this.logger.debug('arena hook:', arena.constructor.name, hook, handler)
          const cmd = handler(arena.instance, event)
          cmd.execute(this.client)
        }))
      }))
    })
    return merge(...hooks)
  }

  private clearArena(arena: ConfiguredArena): Observable<ConfiguredArena> {
    return defer(() => of(this.common.movePlayersToHolding())).pipe(
      this.command(),
      // delay(500),
      this.command(arena.instance.cleanup()),
    )
  }

  private arenaEntryRequirements(arena: ConfiguredArena): Observable<ConfiguredArena> {
    return this.arenaRequirements(arena, 'entry', arenaDescriptor(arena.instance).entryRequirements)
  }

  private arenaExitRequirements(arena: ConfiguredArena): Observable<ConfiguredArena> {
    return this.arenaRequirements(arena, 'exit', arenaDescriptor(arena.instance).exitRequirements)
  }

  private arenaRequirements(arena: ConfiguredArena, type: 'entry' | 'exit', requirements: ArenaRequirement[]): Observable<ConfiguredArena> {

    console.log('arenaRequirements', arenaDescriptor(arena.instance).title)
    const reqs$ = requirements
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
