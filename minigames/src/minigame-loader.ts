import { readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

import { Injectable, Registerable } from '@dandi/core'

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
}

@Injectable()
export class MinigameLoader {

  public loadMinigame(game: GameInfo): LoadedGameInfo {
    this.cleanupMinigame(game)
    const loadedGame = this.getGameInfo(game.key)
    return Object.assign({
      providers: [
        loadedGame.module,
      ],
    }, loadedGame)
  }

  public listGames(): GameInfo[] {
    const minigamesRoot = resolve(__dirname, '..')
    return readdirSync(minigamesRoot)
      .filter(item => {
        if (item === 'src' || item.startsWith('index.')) {
          return false
        }
        const stats = statSync(resolve(minigamesRoot, item))
        return stats.isDirectory()
      })
      .map(name => {
        try {
          return this.getGameInfo(name)
        } catch (err) {
          console.warn(err)
          return undefined
        }
      })
      .filter(game => !!game)
  }

  private getGameInfo(key: string): GameInfo {
    const relativePath = join('..', key)
    const rootPath = resolve(__dirname, relativePath)
    const descriptor = require(relativePath).default
    return Object.assign({
      key,
      rootPath,
      relativePath,
    }, descriptor)
  }

  public cleanupMinigame(info: GameInfo) {
    const gameFiles = findFiles(info.rootPath)
    info.cleanup()
    gameFiles.forEach(file => delete require.cache[file])
  }

}
