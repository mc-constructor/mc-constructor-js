import { ArenasModuleBuilder } from '@ts-mc/minigames'

import { Codslap } from '../codslap-static'

import { BedrockPit } from './bedrock-pit.arena'
import { Boring } from './boring.arena'
import { KingOfTheHill } from './king-of-the-hill.arena'
import { PrimedAndReady } from './primed-and-ready.arena'
import { ShrinkyDinks } from './shrinky-dinks'

export const CodslapArenasModule = new ArenasModuleBuilder()
    .arena(Boring, {
      entry: Codslap.requirements.none,
      exit: [
        // Codslap.requirements.minArenaAge(30),
        Codslap.requirements.minArenaAge(15),
      ],
    })
    .arena(KingOfTheHill, {
      entry: Codslap.requirements.none,
      // entry: [
      //   // Codslap.requirements.count('codslap$', 30),
      //   Codslap.requirements.count('codslap$', 15),
      // ],
      exit: [
        Codslap.requirements.minArenaAge(20),
      ],
    })
    .arena(PrimedAndReady, {
      entry: Codslap.requirements.none,
      // entry: [
      //   Codslap.requirements.count('codslap$', 30),
      // ],
      exit: [
        Codslap.requirements.minArenaAge(20),
      ],
    })
    .arena(ShrinkyDinks, {
      entry: [
        // Codslap.requirements.count('codslap$', 5),
        Codslap.requirements.count('codslap$', 45),
      ],
      exit: [
        Codslap.requirements.minArenaAge(20),
      ],
    })
    .arena(BedrockPit, {
      entry: [
        Codslap.requirements.count('codslap$', 500),
      ],
      exit: [
        Codslap.requirements.minArenaAge(20),
      ],
    })

