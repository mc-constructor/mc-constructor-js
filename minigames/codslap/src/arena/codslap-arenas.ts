import { ArenasModuleBuilder } from '@ts-mc/minigames/arenas'

import { Codslap } from '../codslap-static'

import { BedrockPit } from './bedrock-pit.arena'
import { Boring } from './boring.arena'
import { KingOfTheHill } from './king-of-the-hill.arena'
import { localToken } from './local-token'
import { PrimedAndReady } from './primed-and-ready.arena'
import { ShrinkyDinks } from './shrinky-dinks'

const RealCodslapArenasModule = new ArenasModuleBuilder(localToken.PKG)
    .arena(Boring, {
      entry: Codslap.requirements.none,
      exit: [
        Codslap.requirements.minArenaAge(30),
      ],
    })
    .arena(KingOfTheHill, {
      entry: [
        Codslap.requirements.count('codslap$', 15),
      ],
      exit: [
        Codslap.requirements.minArenaAge(30),
        Codslap.requirements.count('codslap$', 15),
      ],
    })
    .arena(PrimedAndReady, {
      entry: [
        Codslap.requirements.count('codslap$', 30),
      ],
      exit: [
        Codslap.requirements.minArenaAge(30),
        Codslap.requirements.count('codslap$', 15),
      ],
    })
    .arena(ShrinkyDinks, {
      entry: [
        Codslap.requirements.count('codslap$', 45),
      ],
      exit: [
        Codslap.requirements.minArenaAge(30),
        Codslap.requirements.count('codslap$', 15),
      ],
    })
    .arena(BedrockPit, {
      entry: [
        Codslap.requirements.count('codslap$', 500),
      ],
      exit: [
        Codslap.requirements.minArenaAge(120),
        Codslap.requirements.count('codslap$', 500),
      ],
    })

const TestCodslapArenasModule = new ArenasModuleBuilder(localToken.PKG)
  .arena(Boring, {
    entry: Codslap.requirements.none,
    exit: [
      Codslap.requirements.minArenaAge(10),
    ],
  })
  .arena(KingOfTheHill, {
    entry: [
      Codslap.requirements.count('codslap$', 5),
    ],
    exit: [
      Codslap.requirements.minArenaAge(30),
      Codslap.requirements.count('codslap$', 5),
    ],
  })
  .arena(PrimedAndReady, {
    entry: [
      Codslap.requirements.count('codslap$', 5),
    ],
    exit: [
      Codslap.requirements.minArenaAge(30),
      Codslap.requirements.count('codslap$', 5),
    ],
  })
  .arena(ShrinkyDinks, {
    entry: [
      Codslap.requirements.count('codslap$', 5),
    ],
    exit: [
      Codslap.requirements.minArenaAge(180),
      Codslap.requirements.count('codslap$', 5),
    ],
  })
  .arena(BedrockPit, {
    entry: [
      Codslap.requirements.count('codslap$', 5),
    ],
    exit: [
      Codslap.requirements.minArenaAge(180),
      Codslap.requirements.count('codslap$', 5),
    ],
  })

// export const CodslapArenasModule = RealCodslapArenasModule
export const CodslapArenasModule = TestCodslapArenasModule
