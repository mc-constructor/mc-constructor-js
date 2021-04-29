import { readdirSync, statSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { resolve, relative } from 'path'

import { Disposable } from '@dandi/common'
import { Inject, Injectable, Injector, Logger, Registerable } from '@dandi/core'
import { RequestClient } from '@ts-mc/core/client'
import { MapCommand, MapCommandOperatorFn } from '@ts-mc/core/command'
import { createGameScope, GameScope } from '@ts-mc/minigames'
import { defer, from, Observable, of } from 'rxjs'
import { catchError, finalize, map, share } from 'rxjs/operators'

import { localToken } from './local-token'
import { Minigame, MinigameDescriptor } from './minigame'

async function findFiles(dir: string, files: string[] = []): Promise<string[]> {
  const paths = await readdir(dir)
  return paths.reduce(async (prevResult, item) => {
    const result = await prevResult
    const path = resolve(dir, item)
    const fileStat = await stat(path)
    if (fileStat.isDirectory()) {
      return await findFiles(path, result)
    } else if (fileStat.isFile()) {
      result.push(path)
    }
    return result
  }, Promise.resolve(files))

}

export interface MinigameInfo extends MinigameDescriptor {
  rootPath: string
  relativePath: string
}

export interface LoadedMinigame extends MinigameInfo {
  providers: Registerable[]
}

export const LoadedMinigame = localToken.opinionated('LoadedMinigame', {
  multi: false,
  restrictScope: GameScope
})

export interface InstancedMinigame extends LoadedMinigame {
  injector: Injector
  instance: Minigame
  run$: Observable<any>
}

const MINIGAMES_ROOT = resolve(__dirname, '../../../minigames')

@Injectable()
export class MinigameLoader {

  constructor(
    @Inject(Injector) private injector: Injector,
    @Inject(RequestClient) private client: RequestClient,
    @Inject(MapCommand) private mapCommand: MapCommandOperatorFn,
    @Inject(Logger) private logger: Logger) {
  }

  public loadMinigame(game: MinigameInfo): Observable<LoadedMinigame> {
    this.logger.info('loading game:', game.title)

    return from(findFiles(game.rootPath)).pipe(
      map(gameFiles => {
        gameFiles.forEach(file => delete require.cache[file])
        return this.getGameInfo(game.key)
      })
    )
  }

  public getMinigameInstance(minigame: LoadedMinigame): Observable<InstancedMinigame> {
    const loadedMinigameProvider = {
      provide: LoadedMinigame,
      useValue: minigame,
    }
    return defer(() => {
      this.logger.info(`${minigame.title}: starting`)
      const gameInjector = this.injector.createChild(createGameScope(), minigame.providers)
      return from((async () => {
        this.logger.debug('invoking getRunnableMinigame')
        try {
          return await gameInjector.invoke(this as MinigameLoader, 'getInstancedMinigame', loadedMinigameProvider)
        } catch (err) {
          throw Object.assign(err, { type: 'MinigameLoaderError' })
        }
      })()).pipe(
        catchError(err => {
          this.logger.error(err)
          if (err.type === 'MinigameLoaderError') {
            throw err
          }
          return of(undefined)
        }),
        finalize(() => {
          this.logger.info('Disposing gameInjector')
          Disposable.dispose(gameInjector, 'cleanup')
        }),
        share(),
      )
    })
  }

  public getInstancedMinigame(
    @Inject(Injector) injector: Injector,
    @Inject(Minigame) instance: Minigame,
    @Inject(LoadedMinigame) loadedMinigame: LoadedMinigame,
  ): InstancedMinigame {
    this.logger.debug('getInstancedMinigame', loadedMinigame.title)

    return Object.assign(
      {
        injector,
        instance,
        run$: instance.run$,
      },
      loadedMinigame,
      {
        providers: loadedMinigame.providers.slice(0),
      }
    )
  }

  public listGames(): MinigameInfo[] {
    return readdirSync(MINIGAMES_ROOT)
      .filter(item => {
        if (item === 'src' || item.startsWith('index.')) {
          return false
        }
        const stats = statSync(resolve(MINIGAMES_ROOT, item))
        return stats.isDirectory()
      })
      .map(name => {
        try {
          return this.getGameInfo(name)
        } catch (err) {
          this.logger.warn(err)
          return undefined
        }
      })
      .filter(game => !!game)
  }

  private getGameInfo(key: string): LoadedMinigame {
    const rootPath = resolve(MINIGAMES_ROOT, key)
    const relativePath = relative(__dirname, rootPath)
    const descriptor = require(relativePath).default
    return Object.assign({
      key,
      rootPath,
      relativePath,
      providers: [
        descriptor.module,
      ],
    }, descriptor)
  }
}
