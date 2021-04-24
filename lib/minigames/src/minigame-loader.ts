import { readdirSync, statSync } from 'fs'
import { resolve, relative } from 'path'

import { Disposable } from '@dandi/common'
import { Inject, Injectable, Logger, Registerable } from '@dandi/core'

import { MinigameDescriptor } from './minigame'

function findFiles(dir: string, files: string[] = []): string[] {
  return readdirSync(dir).reduce((result, item) => {
    const path = resolve(dir, item)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      findFiles(path, result)
    } else if (stat.isFile()) {
      result.push(path)
    }
    return result
  }, files)
}

export interface GameInfo extends MinigameDescriptor {
  rootPath: string
  relativePath: string
}

export interface LoadedGameInfo extends GameInfo {
  providers: Registerable[]
  cleanupTasks: (() => void)[]
}

const MINIGAMES_ROOT = resolve(__dirname, '../../../minigames')

@Injectable()
export class MinigameLoader implements Disposable {

  private readonly loadedGames = new Map<string, LoadedGameInfo>()

  constructor(@Inject(Logger) private logger: Logger) {
  }

  public loadMinigame(game: GameInfo): LoadedGameInfo {
    this.logger.info('loading game:', game.title)
    const existingLoadedGame = this.loadedGames.get(game.key)
    if (existingLoadedGame) {
      this.cleanupMinigame(existingLoadedGame)
    }
    const loadedGame = this.getGameInfo(game.key)
    this.loadedGames.set(loadedGame.key, loadedGame)
    return loadedGame
  }

  public listGames(): GameInfo[] {
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

  private getGameInfo(key: string): LoadedGameInfo {
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
      cleanupTasks: [],
    }, descriptor)
  }

  public cleanupMinigame(info: LoadedGameInfo) {
    this.logger.info(`${info.title}: cleaning up previous instance`)
    const gameFiles = findFiles(info.rootPath)
    info.cleanupTasks.forEach(task => task())
    info.cleanup()
    gameFiles.forEach(file => delete require.cache[file])
    this.loadedGames.delete(info.key)
  }

  public dispose(reason: string): void {
    [...this.loadedGames.values()].forEach(game => this.cleanupMinigame(game))
    this.loadedGames.clear()
  }

}
