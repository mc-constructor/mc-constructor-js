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

export interface PlatformArenaConstants {
  center: Coordinates
  spawnOffsetFromFloor: Coordinates
  spawnBlacklistOffset: Area
}

export abstract class ArenaBase implements Arena {

  public static readonly entryRequirements: ArenaRequirement[] = []
  public static readonly exitRequirements: ArenaRequirement[] = []

  public abstract readonly layers: PlatformLayer[]
  public readonly hooks: ArenaHooks

  public get center(): Coordinates {
    return this.constants.center
  }

  public get spawnOffsetFromFloor(): Coordinates {
    return this.constants.spawnOffsetFromFloor
  }

  public get spawnBlacklistOffset(): Area {
    return this.constants.spawnBlacklistOffset
  }

  private readonly spawnAreas = new Map<Area, Area>()
  private readonly spawnBlacklist = new Map<Area, Area>()

  protected constructor(
    protected readonly constants: PlatformArenaConstants,
  ) {}

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

  private getRandomSpawnCandidate(): Coordinates {
    const spawnAreas = [...this.spawnAreas.values()]
    const layer = spawnAreas[randomInt(0, spawnAreas.length - 1)]
    return loc(
      randomInt(layer.start.x, layer.end.x),
      randomInt(layer.start.y, layer.end.y),
      randomInt(layer.start.z, layer.end.z),
    )
  }

  public isBlacklistedSpawn(spawn: Coordinates): boolean {
    if (!spawn) {
      return true
    }
    return [...this.spawnBlacklist.values()].some(blacklisted => blacklisted.contains(spawn))
  }

  public init(): Command {
    this.spawnAreas.clear()
    this.spawnBlacklist.clear()
    return this.fill()
  }

  protected fill(resetBlock?: Block): Command {
    return parallel(...this.layers.map(layer => {
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
