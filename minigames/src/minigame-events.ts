import { Logger } from '@dandi/core'
import { dequeueReplay } from '@minecraft/core/common/rxjs'
import { Players } from '@minecraft/core/players'
import { EntityEvent, eventType, Player, PlayerEvent, ServerEvents, ServerEventType } from '@minecraft/core/client'
import { interval, merge, MonoTypeOperatorFunction, Observable, of, race } from 'rxjs'
import { delay, filter, map, share, switchMap, tap } from 'rxjs/operators'

import { MinigameAgeEvent } from './minigame-age-event'

export class MinigameEvents {

  public readonly playerDeath$: Observable<EntityEvent>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly playerReady$: Observable<Player>

  public readonly minigameAge$: Observable<MinigameAgeEvent> = interval(1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )

  protected readonly entityDeath$: Observable<EntityEvent>
  protected readonly playerAttack$: Observable<PlayerEvent>

  private _run$: Observable<any>
  public get run$(): Observable<any> {
    if (!this._run$) {
      const streams = [
        this.playerDeath$,
        this.playerRespawn$,
        this.playerAttack$,
        this.playerReady$,
        ...this.getRunStreams(),
      ]
      this._run$ = merge(...streams)
    }
    return this._run$
  }

  constructor(
    protected readonly events$: ServerEvents,
    protected readonly players: Players,
    protected readonly logger: Logger,
  ) {
    this.logger.debug('ctr')
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
      filter(event => players.hasNamedPlayer(event.entityId)),
      tap(event => this.logger.debug('playerDeath$', event.entityId)),
      dequeueReplay(
        this.playerRespawn$,
        (respawnPlayer, playerDeath) => respawnPlayer.player.name === playerDeath.entityId,
      ),
    )
    this.playerAttack$ = events$.pipe(
      eventType(ServerEventType.playerAttackEntity),
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
    this.playerReady$ = this.playerDeath$.pipe(
      switchMap(playerDeath => race(
        this.playerRespawn$.pipe(
          filter(respawn => respawn.player.name === playerDeath.entityId),
          map(respawn => this.players.players.find(player => player.name === respawn.player.name)),
        ),
        this.players.playerLeave$.pipe(filter(leavingPlayer => leavingPlayer.name === playerDeath.entityId)),
      )),
      share(),
    )
  }

  public waitForPlayerReady(playerName: string, delayAfterReady: number = 0): Observable<Player> {
    return this.playerReady$.pipe(
      filter(readyPlayer => readyPlayer.name === playerName),
      delay(delayAfterReady),
    )
  }

  /**
   * A helper function for implementing timed events that are dependent on all players being ready
   * @param timedEventFn
   */
  public timedPlayerReadyEvent<T>(
    timedEventFn: ((state?: T) => Observable<true>)
  ): MonoTypeOperatorFunction<T> {
    return switchMap((state: T) =>
      race(
        timedEventFn(state),
        this.playerDeath$,
      ).pipe(
        map(raceResult => ({ raceResult, state })),
        switchMap(({ raceResult, state }) => {
          if (raceResult === true) {
            return of(state)
          }
          return this.waitForPlayerReady(raceResult.entityId, 2500).pipe(
            map(() => state)
          )
        })
      ),
    )
  }

  protected getRunStreams(): Observable<any>[] {
    return []
  }

  protected debug<T>(tapFn: ((event: T) => any[])): MonoTypeOperatorFunction<T> {
    return tap<T>(event => this.logger.debug(...tapFn(event)))
  }

}
