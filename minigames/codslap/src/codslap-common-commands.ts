import { Inject } from '@dandi/core'
import { generateRandomInt } from '@ts-mc/common'
import { clear, rawCmd } from '@ts-mc/core/cmd'
import { CommandRequest, parallel, series } from '@ts-mc/core/command'
import { area, Coordinates, Item, loc, Mob, Player } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'
import { Arena, ArenaMinigameEvents, CommonCommandsBase } from '@ts-mc/minigames/arenas'
import { HookHandler } from '@ts-mc/minigames/behaviors'
import { SummonBehaviorManager } from '@ts-mc/minigames/entities'

import { CodslapObjectives } from './codslap-objectives'
import { LEVELED_WEAPONS } from './codslapper'

const LEVELS: [number, number, number, number, number, number] = [500, 234, 104, 42, 15, 0]

export class CodslapCommonCommands extends CommonCommandsBase {

  public readonly arenaSize = 35
  public readonly center: Coordinates = loc(0, 100, 0)
  public readonly baseStart = this.center.modify.west(this.arenaSize).modify.north(this.arenaSize)
  public readonly baseEnd = this.center.modify.east(this.arenaSize).modify.south(this.arenaSize)
  public readonly spawnOffsetFromFloor = loc(0, 1, 0)
  public readonly spawnBlacklistOffset = area(
    this.spawnOffsetFromFloor.modify.up(100),
    this.spawnOffsetFromFloor.modify.down(100),
  )

  public readonly summonCowsOnStartBehavior: HookHandler<ArenaMinigameEvents>
  public readonly summonCowsOnRespawnBehavior: HookHandler<ArenaMinigameEvents>

  constructor(
    @Inject(CodslapObjectives) private objectives: CodslapObjectives,
    @Inject(SummonBehaviorManager) protected readonly summon: SummonBehaviorManager,
  ) {
    super()

    this.summonCowsOnStartBehavior = this.summon.createMobBehavior(
      Mob.cow,
      { base: 10, playerBonus: generateRandomInt(0, 1), playerMultiplier: 1 },
    )

    this.summonCowsOnRespawnBehavior = summon.createMobBehavior(
      Mob.cow,
      { base: 10, playerBonus: generateRandomInt(0, 5) },
    )
  }

  public equip(target: string | Player, weapon?: Item): CommandRequest {
    const targetId = typeof target === 'string' ? target : target.name
    return this.doEquip(targetId, weapon)
  }

  private doEquip(target: string, weapon?: Item): CommandRequest {
    return parallel(
      'codslapCommon.equip',
      clear(target),
      rawCmd(`replaceitem entity ${target} weapon.mainhand ${weapon || this.getPlayerWeapon(target)[0]}`),
    )
  }

  public movePlayersToArena(players: Player[], arena: Arena<MinigameEvents>): CommandRequest {
    return series(
      'codslapCommon.movePlayersToArena',
      parallel(...players.map(this.resetPlayer.bind(this))),
      super.movePlayersToArena(players, arena),
    )
  }

  public getPlayerWeapon(target: string): [Item, number] {
    const score = this.objectives.codslap.getScore(target)
    const weapon = LEVELED_WEAPONS.find((item, level) => score >= LEVELS[level])
    const nextLevel = LEVELED_WEAPONS.indexOf(weapon) - 1
    if (nextLevel < 0) {
      return [weapon, NaN]
    }
    return [weapon, LEVELS[nextLevel] - score]
  }

  public resetPlayer(target: string | Player): CommandRequest {
    return this.equip(target)
  }

}
