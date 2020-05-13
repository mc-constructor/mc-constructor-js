import { Logger } from '@dandi/core'
import { Players } from '@ts-mc/core/players'
import { ServerEvents } from '@ts-mc/core/server-events'
import { MinigameEvents } from '@ts-mc/minigames'
import { Observable } from 'rxjs'
import { map, scan, share, switchMap, tap } from 'rxjs/operators'

import { Arena, arenaDescriptor, ConfiguredArena } from './arena'
import { ArenaAgeEvent } from './arena-age-event'
import { ArenaManager } from './arena-manager'

export class ArenaMinigameEvents extends MinigameEvents {

  public readonly arenaAge$: Observable<ArenaAgeEvent>
  public readonly arenaAvailable$: Observable<ConfiguredArena<this>>
  public readonly arenaStart$: Observable<ConfiguredArena<this>>

  private readonly arenaAgeMap = new Map<Arena<this>, Observable<ArenaAgeEvent>>()

  constructor(
    protected readonly arenaManager: ArenaManager<any>,
    events$: ServerEvents,
    players: Players,
    logger: Logger,
  ) {
    super(events$, players, logger)

    this.arenaAvailable$ = this.arenaManager.arenaAvailable$.pipe(
      this.debug(arena => ['arenaAvailable$', arenaDescriptor(arena.instance).title]),
      share(),
    )
    this.arenaStart$ = this.arenaManager.arenaStart$.pipe(
      this.debug(arena => ['arenaStart$', arenaDescriptor(arena.instance).title]),
      share(),
    )
    this.arenaAge$ = this.arenaStart$.pipe(
      switchMap(arena => this.getArenaAge$(arena.instance)),
      share(),
    )
  }

  public getArenaAge$(arena: Arena<this>): Observable<ArenaAgeEvent> {
    let arenaAge$: Observable<ArenaAgeEvent> = this.arenaAgeMap.get(arena)
    if (!arenaAge$) {
      arenaAge$ = this.minigameAge$.pipe(
        map(event => Object.assign({ arenaAge: 0 }, event)),
        scan((result, event) => Object.assign({}, event, {
          arenaAge: result.arenaAge + 1,
        })),
        tap(event => this.logger.debug('arenaAge$', event)),
        share(),
      )
      this.arenaAgeMap.set(arena, arenaAge$)
    }
    return arenaAge$
  }

  protected getRunStreams(): Observable<any>[] {
    return super.getRunStreams().concat(
      this.arenaAvailable$,
      this.arenaStart$,
      this.arenaAge$,
    )
  }
}
