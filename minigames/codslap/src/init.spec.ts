import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClientFixture, requestClientFixture } from '@ts-mc/core/client/testing'
import { Players } from '@ts-mc/core/players'
import { playersFixture, PlayersFixture } from '@ts-mc/core/players/testing'

import { expect } from 'chai'

import { codslapObjectivesFixture, CodslapObjectivesFixture } from '../testing'

import { CodslapCommonCommands } from './codslap-common-commands'
import { CodslapObjectives } from './codslap-objectives'
import { CodslapInit } from './init'

describe.marbles('CodslapInit', () => {

  stubLoggerFactory()

  const harness = testHarness(CodslapInit,
    CodslapCommonCommands,
    {
      provide: Players,
      useFactory: () => players,
    },
    {
      provide: CodslapObjectives,
      useFactory: () => objectives,
    },
  )

  let client: RequestClientFixture
  let players: PlayersFixture
  let objectives: CodslapObjectivesFixture
  let init: CodslapInit

  beforeEach(async () => {
    client = requestClientFixture()
    players = playersFixture()
    objectives = codslapObjectivesFixture()
    init = await harness.inject(CodslapInit)
  })
  afterEach(() => {
    client = undefined
    players = undefined
    init = undefined
  })

})
