import { Inject, Injectable } from '@dandi/core'
import {
  Client,
  eventType,
  MinigameEvent,
  MinigameStartEvent,
  ServerEvents,
  ServerEventType
} from '@minecraft/core/server'
import { Observable, Observer } from 'rxjs'
import { switchMapTo, tap } from 'rxjs/operators'

import { register, unregister } from './cmd/register-minigame'
import { GameInfo, MinigameLoader } from './minigame-loader'
import { MinigameRunner } from './minigame-runner'

@Injectable()
export class MinigameManager {

  public readonly minigame$: Observable<MinigameEvent>

  private readonly games = new Map<string, GameInfo>()

  constructor(
    @Inject(Client) private client: Client,
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(MinigameLoader) private loader: MinigameLoader,
    @Inject(MinigameRunner) private runner: MinigameRunner,
  ) {
    const init$ = new Observable<void>(this.init.bind(this, loader.listGames()))
    this.minigame$ = init$.pipe(
      switchMapTo(events$),
      eventType(ServerEventType.minigameStart),
      tap(this.startGame.bind(this))
    )
  }

  public startGame(event: MinigameStartEvent): void {
    const game = this.games.get(event.key)
    if (!game) {
      throw new Error(`No game with key ${event.key}`)
    }

    const loadedGame = this.loader.loadMinigame(game)
    this.games.set(game.key, loadedGame)

    this.runner.runGame(loadedGame)
  }

  protected init(games: GameInfo[], o: Observer<void>): () => void {
    games.forEach(game => {
      register(game).execute(this.client)
      this.games.set(game.key, game)
    })
    o.next()
    return () => {
      [...this.games.values()].forEach(game => {
        this.loader.cleanupMinigame(game)
        unregister(game).execute(this.client)
        this.games.delete(game.key)
      })
    }
  }

}
