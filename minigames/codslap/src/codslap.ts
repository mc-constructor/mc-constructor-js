import { Inject } from '@dandi/core'

import { text, title } from '@minecraft/core/cmd'
import { Command } from '@minecraft/core/command'
import { Players } from '@minecraft/core/players'
import { Client } from '@minecraft/core/server'

import { Minigame } from '@minecraft/minigames'
import { Observable } from 'rxjs'


import { CodslapEvents } from './codslap-events'
import { Codslap } from './codslap-metadata'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { CodslapInitCommand } from './init'

/**
 * /summon minecraft:zombie ~ ~ ~ {HandItems:[{id:cod, Count:1,tag:{Enchantments:[{id:knockback,lvl:50}]}}]}
 */

@Minigame(Codslap)
export class CodslapMinigame implements Minigame {

  public readonly run: Observable<any> = this.events.run$

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(CodslapEvents) private events: CodslapEvents,
    @Inject(Client) private client: Client,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CodslapInitCommand) public readonly init: CodslapInitCommand,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
  ) {
  }

  public validateGameState(): Command {
    return title('@a', text(`CODSLAP!`).bold, text('The game will begin in a moment...'))
  }

  public ready(): Command {
    return title('@a', text('Get ready!'), text('May the best codslapper win!').bold)
  }

}
