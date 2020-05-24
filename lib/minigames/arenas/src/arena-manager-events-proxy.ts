import { Injectable } from '@dandi/core'
import { MinigameEvents } from '@ts-mc/minigames'
import { Observable, Subject } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import { ConfiguredArena } from './arena'
import { ArenaManagerEvents } from './arena-manager-events'

@Injectable(ArenaManagerEvents)
export class ArenaManagerEventsProxy<TEvents extends MinigameEvents> implements ArenaManagerEvents<TEvents> {

  public readonly arenaAvailable$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaInit$: Observable<ConfiguredArena<TEvents>>
  public readonly arenaStart$: Observable<ConfiguredArena<TEvents>>

  private readonly init$$ = new Subject<ArenaManagerEvents<TEvents>>()

  constructor() {
    this.arenaAvailable$ = this.init$$.pipe(switchMap(events => events.arenaAvailable$))
    this.arenaInit$ = this.init$$.pipe(switchMap(events => events.arenaInit$))
    this.arenaStart$ = this.init$$.pipe(switchMap(events => events.arenaStart$))
  }

  public init(events: ArenaManagerEvents<TEvents>) {
    this.init$$.next(events)
  }

}
