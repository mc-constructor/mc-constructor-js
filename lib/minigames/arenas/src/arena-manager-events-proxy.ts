import { classFactoryProvider } from '@ts-mc/common'
import { GameScope, MinigameEvents } from '@ts-mc/minigames'
import { Observable, ReplaySubject } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import { ConfiguredArena } from './arena'
import { ArenaManagerEvents } from './arena-manager-events'

export class ArenaManagerEventsProxy<TEvents extends MinigameEvents> implements ArenaManagerEvents<TEvents> {

  public static readonly provide = classFactoryProvider(ArenaManagerEvents, { restrictScope: GameScope })

  public readonly arenaAvailable$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaComplete$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaInit$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaStart$: Observable<ConfiguredArena<TEvents>>

  private readonly init$$ = new ReplaySubject<ArenaManagerEvents<TEvents>>(1)

  constructor() {
    this.arenaAvailable$ = this.initStream(events => events.arenaAvailable$)
    this.arenaComplete$ = this.initStream(events => events.arenaComplete$)
    this.arenaInit$ = this.initStream(events => events.arenaInit$)
    this.arenaStart$ = this.initStream(events => events.arenaStart$)
  }

  public init(events: ArenaManagerEvents<TEvents>) {
    this.init$$.next(events)
    console.log(this.constructor.name, 'init')
  }

  private initStream<T>(fn: (events: ArenaManagerEvents<TEvents>) => Observable<T>): Observable<T> {
    return this.init$$.pipe(
      switchMap(fn),
    )
  }

}
