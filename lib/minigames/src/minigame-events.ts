import { Logger } from '@dandi/core'
import { subclassFactoryProvider } from '@ts-mc/common'
import { RequestClient } from '@ts-mc/core/client'
import { dequeueReplay, pass } from '@ts-mc/common/rxjs'
import {
  EntityEvent,
  PlayerEvent,
  PlayerEvents,
  ServerEvents,
  ServerEventType
} from '@ts-mc/core/server-events'
import { Player } from '@ts-mc/core/types'
import { merge, MonoTypeOperatorFunction, Observable, of, race, timer } from 'rxjs'
import {
  concatMap,
  delay,
  distinctUntilChanged,
  filter,
  pluck,
  map,
  mapTo,
  mergeMap,
  scan,
  share,
  shareReplay,
  startWith,
  take,
  tap,
} from 'rxjs/operators'

import { GameScope } from './game-scope'
import { MinigameAgeEvent } from './minigame-age-event'

export class MinigameEvents extends PlayerEvents {

  public static readonly provide = subclassFactoryProvider(MinigameEvents, { restrictScope: GameScope })

  public readonly playerDeath$: Observable<EntityEvent>
  public readonly playerLimbo$: Observable<Player>
  public readonly playerUnlimbo$: Observable<Player>
  public readonly playerReady$: Observable<Player>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly playersReady$: Observable<boolean>
  public readonly entityDeath$: Observable<EntityEvent>
  public readonly entitySpawn$: Observable<EntityEvent>

  public readonly minigameAge$: Observable<MinigameAgeEvent> = timer(0, 1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )

  protected readonly playerAttack$: Observable<PlayerEvent>

  private _run$: Observable<any>
  public get run$(): Observable<any> {
    if (!this._run$) {
      this._run$ = merge(...this.getRunStreams())
    }
    return this._run$
  }

  constructor(
    client: RequestClient,
    events: ServerEvents,
    logger: Logger,
  ) {
    super(client, events, logger)
    this.entityDeath$ = events.eventStream(ServerEventType.livingDeath).pipe(
      tap(event => this.logger.debug('entityDeath$ - livingDeath', event.entityId)),
      share(),
    )
    this.entitySpawn$ = events.eventStream(ServerEventType.entityJoinWorld).pipe(
      tap(event => this.logger.debug('entitySpawn$ - entityJoinWorld', event.entityId)),
      share(),
    )

    this.playerRespawn$ = events.eventStream(ServerEventType.playerRespawn).pipe(
      tap(event => this.logger.debug('playerRespawn$', event.player.name)),
      share(),
    )
    this.playerDeath$ = this.entityDeath$.pipe(
      filter(event => this.hasNamedPlayer(event.entityId)),
      tap(event => this.logger.debug('playerDeath$', event.entityId)),
      share(),
    )
    this.playerAttack$ = events.eventStream(ServerEventType.playerAttackEntity)
    this.playerUnlimbo$ = merge(
      this.playerRespawn$.pipe(pluck('player')),
      this.playerLeave$,
    ).pipe(
      share(),
    )
    this.playerLimbo$ = this.playerDeath$.pipe(
      map(event => this.getPlayerByName(event.entityId)),
      dequeueReplay(
        this.playerUnlimbo$,
        (eventPlayer, player) => eventPlayer.name === player.name,
      ),
    )

    // FIXME: convert playerReady$ to emit all players that are ready instead of only players that become ready after
    //        dying
    //  - start with any existing alive players, add joined alive players (do they emit a spawn event?)
    //  - needs data on whether players are alive when they join
    //  - dequeueReplay with playerDeath and playerLeave
    // this.playerReady$ = this.playerDeath$.pipe(
    //   switchMap(playerDeath => race(
    //     this.playerRespawn$.pipe(
    //       filter(respawn => respawn.player.name === playerDeath.entityId),
    //       map(respawn => this.players.players.find(player => player.name === respawn.player.name)),
    //     ),
    //     this.players.playerLeave$.pipe(filter(leavingPlayer => leavingPlayer.name === playerDeath.entityId)),
    //   )),
    //   dequeueReplay(
    //     merge(
    //       this.playerDeath$.pipe(map(event => event.entityId)),
    //       this.players.playerLeave$.pipe(map(event => event.name)),
    //     ),
    //     (unreadyPlayerName, respawnedPlayer) => respawnPlayer.player.name === playerDeath.entityId,
    //   ),
    this.playerReady$ = this.playerLimbo$.pipe(
      mergeMap(limboPlayer => this.playerUnlimbo$.pipe(
        filter(player => player.name === limboPlayer.name),
        take(1),
      )),
      share(),
    )

    this.playersReady$ = merge(
      this.playerReady$.pipe(mapTo(-1)),
      this.playerLimbo$.pipe(mapTo(1)),
    ).pipe(
      startWith(0),
      scan((acc, curr) => acc + curr, 0),
      map(limboCount => limboCount === 0),
      distinctUntilChanged(),
      shareReplay(1),
    )
  }

  public waitForPlayerReady(playerName: string, delayAfterReady: number = 0): Observable<Player> {
    return this.playerReady$.pipe(
      filter(readyPlayer => readyPlayer.name === playerName),
      delay(delayAfterReady),
    )
  }

  public waitForAllPlayersReady(delayAfterReady: number = 0): Observable<void> {
    return this.playersReady$.pipe(
      filter(ready => ready === true),
      delayAfterReady === 0 ? pass : delay(delayAfterReady),
      mapTo(undefined)
    )
  }

  /**
   * A helper function for implementing timed server-events that are dependent on all players being ready
   * @param timedEventFn
   * @param delay
   */
  public timedPlayerReadyEvent<T>(
    timedEventFn: ((state?: T) => Observable<true>),
    delay: number = 0,
  ): MonoTypeOperatorFunction<T> {
    return concatMap((state: T) => {
      console.log('before race', state)
      return race(
        timedEventFn(state),
        this.playerLimbo$.pipe(
          tap(v => console.log('waiting on limbo', v)),
        ),
      ).pipe(
        take(1),
        map(raceResult => ({ raceResult, state })),
        mergeMap(({ raceResult, state }) => {
          if (raceResult === true) {
            return of(state)
          }
          return this.waitForAllPlayersReady(delay).pipe(
            mapTo(state),
            take(1),
          )
        }),
      )
    })
  }

  protected getRunStreams(): Observable<any>[] {
    return super.getRunStreams().concat(
      this.minigameAge$, // required to ensure that it does not get reset due to unsubscriptions
      this.playerDeath$,
      this.playerLimbo$,
      this.playerReady$,
      this.playerRespawn$,
      this.playersReady$,
    )
  }

  protected debug<T>(tapFn: ((event: T) => any[])): MonoTypeOperatorFunction<T> {
    return tap<T>(event => this.logger.debug(...tapFn(event)))
  }

}
