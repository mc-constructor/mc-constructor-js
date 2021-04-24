import { Disposable } from '@dandi/common'
import { Inject, Injectable } from '@dandi/core'
import { RequestClient } from '@ts-mc/core/client'
import { MinigameEvents } from '@ts-mc/minigames'
import { isMob, Mob } from '@ts-mc/core/types'
import { merge, Observable, ReplaySubject, Subject } from 'rxjs'
import { filter, map, pluck, scan, share, shareReplay } from 'rxjs/operators'

export interface MobCountEvent {
  mob: Mob
  count: 1 | -1
}

function isMobCountEvent(obj: any): obj is MobCountEvent {
  return obj.count === 1 || obj.count === -1
}

export interface MobSpawnAvailableEvent {
  mob: Mob
  count: number
}

interface MobConfig {
  limit?: number
}

interface MobState {
  count: number
  config: MobConfig
}

interface MobConfigEvent {
  config: MobConfig
}

@Injectable()
export class SummonedEntityManager implements Disposable {

  public readonly mobCountEvent$: Observable<MobCountEvent>
  private readonly trackedMobs = new Map<Mob, Observable<MobState>>()
  private readonly mobConfig = new Map<Mob, Subject<MobConfig>>()

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(MinigameEvents) private readonly events: MinigameEvents,
  ) {
    const mobKilled$ = this.events.entityDeath$.pipe(
      filter(event => isMob(event.entityType)),
      map(event => ({ mob: event.entityType, count: -1 } as MobCountEvent))
    )
    const mobSpawned$ = this.events.entitySpawn$.pipe(
      filter(event => isMob(event.entityType)),
      map(msg => ({ mob: msg.entityType, count: 1 } as MobCountEvent)),
    )
    this.mobCountEvent$ = merge(mobKilled$, mobSpawned$).pipe(
      share(),
    )
  }

  public getMobConfig(mob: Mob): Observable<MobConfig> {
    return this.getMobConfigSubject(mob).asObservable()
  }

  protected getMobConfigSubject(mob: Mob): Subject<MobConfig> {
    const config$$ = this.mobConfig.get(mob) || new ReplaySubject<MobConfig>(1)
    this.mobConfig.set(mob, config$$)
    return config$$
  }

  public getMobState(mob: Mob): Observable<MobState> {
    const state$ = this.trackedMobs.get(mob) || this.createMobState(mob)
    this.trackedMobs.set(mob, state$);
    return state$;
  }

  protected createMobState(mob: Mob): Observable<MobState> {
    const mobState$ = merge(
      this.mobCountEvent$.pipe(filter(event => event.mob === mob)),
      this.getMobConfig(mob).pipe(map(config => ({ config }) as MobConfigEvent)),
    ).pipe(share())
    return mobState$.pipe(
      scan((state, event) => {
        if (isMobCountEvent(event)) {
          if (state.count === 0 && event.count < 0) {
            return Object.assign({}, state, { count: 0 })
          }
          return Object.assign({}, state, { count: state.count + event.count });
        }
        return Object.assign({}, state, { config: Object.assign({}, state.config, event.config) })
      }, { count: 0, config: { limit: Infinity }} as MobState),
      shareReplay(1),
    )
  }

  public getCount(mob: Mob): Observable<number> {
    return this.getMobState(mob).pipe(
      pluck('count'),
      shareReplay(1),
    )
  }

  public limitSpawn(mob: Mob, limit: number): void {
    this.getMobConfigSubject(mob).next({ limit })
  }

  public removeSpawnLimit(mob: Mob): void {
    this.getMobConfigSubject(mob).next({ limit: Infinity })
  }

  public getAvailableSpawn(mob: Mob): Observable<MobSpawnAvailableEvent> {
    return this.getMobState(mob).pipe(
      map(state => ({ mob, count: state.config.limit === Infinity ? Infinity : state.config.limit - state.count })),
      shareReplay(1),
    )
  }

  public getSpawnAvailable(mob: Mob): Observable<MobSpawnAvailableEvent> {
    return this.getAvailableSpawn(mob).pipe(
      filter(event => event.count > 0)
    )
  }

  public dispose(reason: string): void {
    for (const config$$ of this.mobConfig.values()) {
      config$$.complete()
    }
    this.mobConfig.clear()
  }

}
