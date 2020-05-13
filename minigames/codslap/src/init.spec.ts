import { testHarness } from '@dandi/core/testing'
import { impersonate, stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClientFixture, requestClientFixture } from '@ts-mc/core/client/testing'
import { Players } from '@ts-mc/core/players'
import { playersFixture, PlayersFixture } from '@ts-mc/core/players/testing'

import { expect } from 'chai'
import { NEVER, of } from 'rxjs'

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

  describe('initHoldingArea', () => {

    it.only('completes if no commands succeed', () => {

      client.config((cmd => {
        if (cmd.startsWith('fill')) {
          return of({ success: false, extras: ['commands.fill.failed'] })
        }
        if (cmd.startsWith('clear')) {
          return of({ success: false, extras: ['clear.failed.single'] })
        }
        if (cmd.startsWith('effect clear')) {
          return of({ success: false, extras: ['commands.effect.clear.everything.failed'] })
        }
        if (cmd.startsWith('teleport')) {
          return of({ success: true, extras: ['commands.teleport.success.location.single'] })
        }
        console.log('what do i do with', cmd)
        return NEVER
      }))

      const initHoldingArea = impersonate(init, function(this: CodslapInit) {
        return this.initHoldingArea()
      })

      const test$ = initHoldingArea.execute(client)

      expect(test$).with.marbleValues({ a: undefined as any }).to.equal('3000ms (a|)')

    })

  })

})
