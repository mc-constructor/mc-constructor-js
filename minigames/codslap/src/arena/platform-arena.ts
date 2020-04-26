import { block, BlockCommandBuilder } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { randomInt } from '@minecraft/core/common'
import { area, Area, Block, Coordinates, loc } from '@minecraft/core/types'

import { Arena, ArenaHooks, ArenaRequirement } from './arena'

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

export abstract class PlatformArena implements Arena {

  public static readonly entryRequirements: ArenaRequirement[] = []
  public static readonly exitRequirements: ArenaRequirement[] = []

  public abstract readonly layers: PlatformLayer[]
  public readonly hooks: ArenaHooks

  protected readonly spawnAreas: Area[] = []
  protected readonly spawnBlacklist: Area[] = []

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

  protected constructor(public readonly center: Coordinates) {}

  public cleanup(): Command {
    return this.fill(Block.air)
  }

  public getRandomSpawn(): Coordinates {
    let spawn = this.getRandomSpawnCandidate()
    while (this.isBlacklistedSpawn(spawn)) {
      spawn = this.getRandomSpawnCandidate()
    }
    return spawn
  }

  private getRandomSpawnCandidate(): Coordinates {
    const layer = this.spawnAreas[randomInt(0, this.spawnAreas.length - 1)]
    return loc(
      randomInt(layer.start.x, layer.end.x),
      randomInt(layer.start.y, layer.end.y),
      randomInt(layer.start.z, layer.end.z),
    )
  }

  private isBlacklistedSpawn(spawn: Coordinates): boolean {
    if (!spawn) {
      return true
    }
    return this.spawnBlacklist.some(blacklisted => blacklisted.contains(spawn))
  }

  public init(): Command {
    this.spawnAreas.length = 0
    this.spawnBlacklist.length = 0
    return this.fill()
  }

  protected fill(resetBlock?: Block): Command {
    return parallel(...this.layers.map(layer => {
      const [, start, end] = this.getLayerArea(layer)
      if (!resetBlock && !layer.ignoreForSpawn) {
        if (layer.preventSpawn || NO_SPAWN_BLOCKS.includes(layer.block.block)) {
          this.spawnBlacklist.push(area(start.modify.up(5), end.modify.down(2)))
        } else {
          this.spawnAreas.push(area(start.modify.up(2), end.modify.up(2)))
        }
      }
      return (resetBlock ? block(resetBlock) : layer.block).fill(start, end)
    }))
  }

}
