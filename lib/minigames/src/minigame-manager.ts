import { Inject, Injectable, Logger } from '@dandi/core'
import { silence } from '@ts-mc/common/rxjs'
import { RequestClient } from '@ts-mc/core/client'
import { MapCommand, MapCommandOperatorFn } from '@ts-mc/core/command'
import { MinigameStartEvent, ServerEvents, ServerEventType } from '@ts-mc/core/server-events'
import { combineLatest, defer, EMPTY, merge, Observable, of } from 'rxjs'
import {
  bufferCount,
  catchError,
  filter,
  map,
  mergeMap,
  pluck,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators'

import { register, unregister } from './cmd/register-minigame'
import { InstancedMinigame, LoadedMinigame, MinigameInfo, MinigameLoader } from './minigame-loader'
import { MinigameResetEvent, MinigameStopEvent } from '@ts-mc/core/server-events/src/minigame'

export enum ManagerStateType {
  idle = 'idle',
  startRequest = 'startRequest',
  loading = 'loading',
  loaded = 'loaded',
  running = 'running',
}

export interface MinigameIdleInfo {
  event?: MinigameStopEvent | MinigameResetEvent
}

export interface MinigameIdle extends MinigameIdleInfo {
  type: ManagerStateType.idle
}

export interface MinigameStartInfo {
  key: string
  event: MinigameStartEvent | MinigameResetEvent
}

export interface MinigameStartRequest extends MinigameStartInfo {
  type: ManagerStateType.startRequest
}

export interface MinigameLoadingInfo extends MinigameStartInfo {
  info: MinigameInfo
}

export interface MinigameLoading extends MinigameLoadingInfo {
  type: ManagerStateType.loading
}

export interface MinigameLoadedInfo extends MinigameLoadingInfo {
  loaded: LoadedMinigame
}

export interface MinigameLoaded extends MinigameLoadedInfo {
  type: ManagerStateType.loaded
}

export interface MinigameRunningInfo extends MinigameLoadedInfo {
  instanced: InstancedMinigame
}

export interface MinigameRunning extends MinigameRunningInfo {
  type: ManagerStateType.running
}

export type ManagerStateInfo = MinigameIdleInfo | MinigameStartInfo | MinigameLoadingInfo | MinigameLoadedInfo | MinigameRunningInfo

export type ManagerState = MinigameIdle | MinigameStartRequest | MinigameLoading | MinigameLoaded | MinigameRunning

function isStateUpdate<TState extends ManagerState>(obj: false | TState): obj is TState {
  return obj !== false
}

@Injectable()
export class MinigameManager {

  public readonly run$: Observable<ManagerState>
  public readonly state$: Observable<ManagerState>

  private readonly games = new Map<string, MinigameInfo>()

  protected readonly minigameStart$: Observable<MinigameStartRequest>
  protected readonly minigameStop$: Observable<MinigameIdle>
  protected readonly minigameLoading$: Observable<MinigameLoading>
  protected readonly minigameLoaded$: Observable<MinigameLoaded>
  protected readonly minigameRunning$: Observable<MinigameRunning>

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(MinigameLoader) private loader: MinigameLoader,
    @Inject(MapCommand) private mapCommand: MapCommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    this.state$ = this.init().pipe(
      switchMap(() => merge(
        this.minigameStop$,
        this.minigameStart$,
        this.minigameLoading$,
        this.minigameLoaded$,
        this.minigameRunning$,
      )),
      startWith(this.idle()),
      tap(state => {
        const extraDebugArgs: string[] = []
        if (state.type !== ManagerStateType.idle) {
          extraDebugArgs.push(state.key)
        }
        this.logger.debug('state$', state.type, ...extraDebugArgs)
      }),
      shareReplay(1),
    )

    this.minigameStop$ = merge(
      this.events$.eventStream(ServerEventType.minigameStop),
      this.events$.eventStream(ServerEventType.minigameReset),
    ).pipe(
      withLatestFrom(defer(() => this.state$)),
      map(this.onMinigameStop.bind(this)),
      filter(isStateUpdate),
      share(),
    )
    this.minigameStart$ = merge(
      this.events$.eventStream(ServerEventType.minigameStart),
      this.minigameStop$.pipe(
        filter(state => state.event?.type === ServerEventType.minigameReset),
        map(state => state.event),
      )
    ).pipe(
      withLatestFrom(defer(() => this.state$)),
      map(this.onMinigameStartEvent.bind(this)),
      filter(isStateUpdate),
      share(),
    )
    this.minigameLoading$ = this.minigameStart$.pipe(
      tap(event => {
        this.logger.debug(event.type, event)
      }),
      map(this.onMinigameStartRequest.bind(this)),
      filter(isStateUpdate),
      share(),
    )
    this.minigameLoaded$ = this.minigameLoading$.pipe(
      mergeMap(this.onMinigameLoading.bind(this)),
      filter(isStateUpdate),
      share(),
    )
    this.minigameRunning$ = this.minigameLoaded$.pipe(
      mergeMap(state => {
        return this.onMinigameLoaded(state).pipe(
          filter(isStateUpdate),
          // allow the minigame to run until it finishes or a "stop" or "reset" command is received
          takeUntil(merge(this.minigameStop$).pipe(take(1))),
        )
      }),
      share(),
    )

    this.run$ = merge(
      this.state$,

      // these are required to ensure incoming messages
      // but don't spam the output with all the events
      this.events$.run$.pipe(silence()),
    ).pipe(
      catchError(err => {
        logger.error(err)
        return EMPTY
      }),
      share(),
    )
  }

  private idle(event?: MinigameStopEvent | MinigameResetEvent): MinigameIdle {
    return { type: ManagerStateType.idle, event }
  }

  protected stateProps<TState extends ManagerState>(state: TState): ManagerStateInfo {
    const { type, ...props } = state
    return props
  }

  protected transitionState<
    TFromState extends ManagerState,
    TToStateType extends Exclude<ManagerStateType, TFromState['type']>,
    TToState extends Exclude<ManagerState, MinigameIdle | TFromState> & { type: TToStateType}
  >(
    fromState: TFromState,
    toStateType: TToStateType,
    toState: Omit<TToState, 'type' | keyof TFromState>
  ): TToState {
    return Object.assign(this.stateProps(fromState), toState, { type: toStateType }) as TToState
  }

  protected onMinigameStartEvent([event, state]: [MinigameStartEvent | MinigameResetEvent, ManagerState]): MinigameStartRequest | false {
    if (state.type !== ManagerStateType.idle) {
      this.logger.error(`A game is already in progress for minigame '${state.key}'`)
      return false
    }
    return this.transitionState(state, ManagerStateType.startRequest, { key: event.key })
  }

  protected onMinigameStartRequest(state: MinigameStartRequest): false | MinigameLoading {
    const info = this.games.get(state.key)
    if (!info) {
      this.logger.error(`No game with key ${state.key}`)
      return false
    }
    return this.transitionState(state,  ManagerStateType.loading, { info })
  }

  protected onMinigameLoading(state: MinigameLoading): Observable<false | MinigameLoaded> {
    return this.loader.loadMinigame(state.info).pipe(
      map(loaded => this.transitionState(state, ManagerStateType.loaded, { loaded }))
    )
  }

  protected onMinigameLoaded(state: MinigameLoaded): Observable<MinigameRunning | false> {
    return this.loader.getMinigameInstance(state.loaded).pipe(
      mergeMap(instanced => merge(
        of(this.transitionState(state, ManagerStateType.running, { instanced })),
        instanced.run$.pipe(silence()),
      ))
    )
  }

  protected onMinigameStop([event, state]: [MinigameStopEvent | MinigameResetEvent, ManagerState]): MinigameIdle | false {
    if (state.type === ManagerStateType.idle) {
      this.logger.error(`${event.type} received for minigame '${event.key}', but there is no minigame loading or running`)
      return false
    }
    if (state.key !== event.key) {
      this.logger.error(`${event.type} received for minigame '${event.key}', but another game '${state.key}' is running`)
      return false
    }
    return this.idle(event)
  }

  // FIXME: where's this get called from?
  public cleanup(): Observable<any> {
    return defer(() => of(...this.games.values())).pipe(
      mergeMap(game => {
        const unregCmd$ = unregister(game).execute(this.client)
        return combineLatest([of(game), unregCmd$])
      }),
      tap(([game]) => this.games.delete(game.key)),
      share(),
    )
  }

  protected init(): Observable<MinigameInfo[]> {
    const games = this.loader.listGames()
    return defer(() => of(...games)).pipe(
      mergeMap(game => {
        const regCmd$ = register(game).execute(this.client)
        return combineLatest([of(game), regCmd$])
      }),
      pluck(0),
      tap(game => this.games.set(game.key, game)),
      bufferCount(games.length),
      share(),
    )
  }

}
