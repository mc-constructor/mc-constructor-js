import { Logger } from '@dandi/core'
import { subclassFactoryProvider } from '@ts-mc/common'
import { RequestClient } from '@ts-mc/core/client'
import { dequeueReplay } from '@ts-mc/common/rxjs'
import {
  EntityEvent,
  eventType,
  PlayerEvent,
  PlayerEvents,
  ServerEvents,
  ServerEventType
} from '@ts-mc/core/server-events'
import { Player } from '@ts-mc/core/types'
import { interval, merge, MonoTypeOperatorFunction, Observable, of, race } from 'rxjs'
import {
  delay,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  mapTo,
} from 'rxjs/operators'

import { GameScope } from './game-scope'
import { MinigameAgeEvent } from './minigame-age-event'

export class MinigameEvents extends PlayerEvents {

  public static readonly provide = subclassFactoryProvider(MinigameEvents, { restrictScope: GameScope })

  public readonly playerDeath$: Observable<EntityEvent>
  public readonly playerLimbo$: Observable<Player>
  public readonly playerReady$: Observable<Player>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly playersReady$: Observable<boolean>

  public readonly minigameAge$: Observable<MinigameAgeEvent> = interval(1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )

  protected readonly entityDeath$: Observable<EntityEvent>
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
    events$: ServerEvents,
    logger: Logger,
  ) {
    super(client, events$, logger)
    this.entityDeath$ = events$.pipe(
      eventType(ServerEventType.entityLivingDeath),
      tap(event => this.logger.debug('entityDeath$ - entityLivingDeath', event.entityId)),
      share(),
    )
    this.playerRespawn$ = events$.pipe(
      eventType(ServerEventType.playerRespawn),
      tap(event => this.logger.debug('playerRespawn$', event.player.name)),
      share(),
    )
    this.playerDeath$ = this.entityDeath$.pipe(
      filter(event => this.hasNamedPlayer(event.entityId)),
      tap(event => this.logger.debug('playerDeath$', event.entityId)),
      share(),
    )
    this.playerAttack$ = events$.pipe(
      eventType(ServerEventType.playerAttackEntity),
      share(),
    )
    this.playerLimbo$ = this.playerDeath$.pipe(
      map(event => this.getPlayerByName(event.entityId)),
      dequeueReplay(
        merge(this.playerRespawn$.pipe(map(respawn => respawn.player)), this.playerLeave$),
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
      mergeMap(limboPlayer =>
        race(
          this.playerRespawn$.pipe(
            filter(respawn => respawn.player.name === limboPlayer.name),
            map(respawn => this.getPlayerByName(respawn.player.name)),
          ),
          this.playerLeave$.pipe(filter(leavingPlayer => leavingPlayer.name === limboPlayer.name)),
        ).pipe(
          take(1),
        ),
      ),
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

  public waitForAllPlayersReady(playerName: string, delayAfterReady: number = 0): Observable<void> {
    return this.playersReady$.pipe(
      filter(ready => ready === true),
      delay(delayAfterReady),
      mapTo(undefined)
    )
  }

  /**
   * A helper function for implementing timed server-events that are dependent on all players being ready
   * @param timedEventFn
   */
  public timedPlayerReadyEvent<T>(
    timedEventFn: ((state?: T) => Observable<true>)
  ): MonoTypeOperatorFunction<T> {
    return switchMap((state: T) =>
      race(
        timedEventFn(state),
        this.playerLimbo$,
      ).pipe(
        map(raceResult => ({ raceResult, state })),
        switchMap(({ raceResult, state }) => {
          if (raceResult === true) {
            return of(state)
          }
          return this.waitForPlayerReady(raceResult.name, 2500).pipe(
            mapTo(state)
          )
        })
      ),
    )
  }

  protected getRunStreams(): Observable<any>[] {
    // TODO: is this even needed?
    return super.getRunStreams().concat(
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
