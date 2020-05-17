import { block, BlockCommandBuilder } from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { area, Area, Block, Coordinates, loc } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'

import { Arena } from './arena'
import { ArenaHooks } from './arena-hook'
import { CommonCommands } from './common-commands'

export interface PlatformLayer<TBlock extends Block = Block> {
  block: BlockCommandBuilder<TBlock>
  radius: number | [number, number] // x,z
  depth: number
  centerOffset?: Coordinates
  preventSpawn?: boolean
  ignoreForSpawn?: boolean
}

const NO_SPAWN_BLOCKS: Block[] = [
  Block.air,
  Block.fire,
  Block.lava,
  Block.voidAir,
  Block.water,
]

export abstract class ArenaBase<TEvents extends MinigameEvents, TCommon extends CommonCommands = CommonCommands>
  implements Arena<TEvents> {

  public abstract readonly layers: PlatformLayer[]
  public readonly hooks: ArenaHooks<TEvents>

  public get center(): Coordinates {
    return this.common.center
  }

  public get spawnOffsetFromFloor(): Coordinates {
    return this.common.spawnOffsetFromFloor
  }

  public get spawnBlacklistOffset(): Area {
    return this.common.spawnBlacklistOffset
  }

  private readonly spawnAreas = new Map<Area, Area>()
  private readonly spawnBlacklist = new Map<Area, Area>()

  protected constructor(
    protected readonly common: TCommon,
  ) {}

  public cleanup(): CommandRequest {
    return this.fill(Block.air)
  }

  public getRandomSpawn(): Coordinates {
    return this.common.getRandomLocation([...this.spawnAreas.values()], [...this.spawnBlacklist.values()])
  }

  public init(): CommandRequest {
    this.spawnAreas.clear()
    this.spawnBlacklist.clear()
    return this.fill()
  }

  protected getLayerCenter(layer: PlatformLayer): Coordinates {
    if (layer.centerOffset) {
      return this.center.modify.offset(layer.centerOffset)
    }
    return this.center
  }

  protected getLayerStart(layer: PlatformLayer, center: Coordinates): Coordinates {
    if (Array.isArray(layer.radius)) {
      const [x, z] = layer.radius
      return center.modify.offset(loc(x, layer.depth - 1, z))
    }
    return center.modify.east(layer.radius).modify.south(layer.radius).modify.up(layer.depth - 1)
  }

  protected getLayerEnd(layer: PlatformLayer, center: Coordinates): Coordinates {
    if (Array.isArray(layer.radius)) {
      const [x, z] = layer.radius
      return center.modify.offset(loc(-x, 0, -z))
    }
    return center.modify.west(layer.radius).modify.north(layer.radius)
  }

  protected getLayerArea(layer: PlatformLayer): [Coordinates, Coordinates, Coordinates] {
    const center = this.getLayerCenter(layer)
    return [
      center,
      this.getLayerStart(layer, center),
      this.getLayerEnd(layer, center),
    ]
  }

  protected blacklistSpawnArea(...areas: Area[]): void {
    areas.forEach(entry => {
      const blacklisted = area(
        entry.start.modify.offset(this.spawnBlacklistOffset.start),
        entry.end.modify.offset(this.spawnBlacklistOffset.end),
      )
      this.spawnBlacklist.set(entry, blacklisted)
    })
  }

  protected restoreSpawnArea(...areas: Area[]): void {
    areas.forEach(entry => this.spawnBlacklist.delete(entry))
  }

  protected addSpawnArea(...areas: Area[]): void {
    areas.forEach(entry => {
      const spawnArea = area(
        entry.start.modify.offset(this.spawnOffsetFromFloor),
        entry.end.modify.offset(this.spawnOffsetFromFloor),
      )
      this.spawnAreas.set(entry, spawnArea)
    })
  }

  protected fill(resetBlock?: Block): CommandRequest {
    return parallel('arenaBase.fill', ...this.layers.map(layer => {
      const [, start, end] = this.getLayerArea(layer)
      if (!resetBlock && !layer.ignoreForSpawn) {
        if (layer.preventSpawn || NO_SPAWN_BLOCKS.includes(layer.block.block)) {
          this.blacklistSpawnArea(area(start, end))
        } else {
          this.addSpawnArea(area(start, end))
        }
      }
      return (resetBlock ? block(resetBlock) : layer.block).fill(start, end)
    }))
  }

}
