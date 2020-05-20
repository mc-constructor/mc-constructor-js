import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClientFixture, requestClientFixture } from '@ts-mc/core/client/testing'

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
      provide: CodslapObjectives,
      useFactory: () => objectives,
    },
  )

  let client: RequestClientFixture
  let objectives: CodslapObjectivesFixture
  let init: CodslapInit

  beforeEach(async () => {
    client = requestClientFixture()
    objectives = codslapObjectivesFixture()
    init = await harness.inject(CodslapInit)
  })
  afterEach(() => {
    client = undefined
    init = undefined
  })

})
