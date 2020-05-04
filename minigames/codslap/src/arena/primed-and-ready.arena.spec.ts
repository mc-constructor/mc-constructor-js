import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness } from '@dandi/core/testing'
import { CommonModule } from '@minecraft/core/common'
import { stubLoggerFactory } from '@minecraft/core/common/testing'
import { Players } from '@minecraft/core/players'
import { playersFixture, PlayersFixture } from '@minecraft/core/players/testing'
import { Client } from '@minecraft/core/client'
import { clientFixture, ClientFixture } from '@minecraft/core/client/testing'
import { expect } from 'chai'
import { merge } from 'rxjs'
import { take, tap } from 'rxjs/operators'

import { codslapEventsFixture, CodslapEventsFixture, codslapObjectivesFixture } from '../../testing'

import { CodslapEvents } from '../codslap-events'
import { CodslapObjectives } from '../codslap-objectives'
import { CommonCommands } from '../common'

import { Arena } from './arena'
import { PrimedAndReady } from './primed-and-ready.arena'

describe('PrimedAndReadyArena', () => {

  stubLoggerFactory()

  const harness = testHarness(PrimedAndReady,
    CommonCommands,
    CommonModule,
    ConsoleLogListener,
    {
      provide: Client,
      useFactory: () => client,
    },
    {
      provide: CodslapEvents,
      useFactory: () => events,
    },
    {
      provide: Players,
      useFactory: () => players,
    },
    {
      provide: CodslapObjectives,
      useFactory: codslapObjectivesFixture,
    }
  )

  let client: ClientFixture
  let events: CodslapEventsFixture
  let players: PlayersFixture
  let arena: Arena

  beforeEach(async () => {
    client = clientFixture()
    events = codslapEventsFixture()
    players = playersFixture()
    players.players.push({ name: 'testguy', uuid: '12345' })
    arena = (await harness.injectMulti<Arena>(Arena))[0]
    arena.init()
  })
  afterEach(() => {
    client = undefined
    events = undefined
    players = undefined
    arena = undefined
  })

  it('can be injected', () => {
    expect(arena).to.exist
  })

  describe.marbles('run', ({ cold }) => {

    it('starts making tnt explosions after the minDelay', () => {
      events.config({
        arenaAvailable$: cold('b'),
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...PrimedAndReady.exitRequirements.map(req => req(events as any, arena)))

      // first boom = 20s minDelay + 5s delay after tnt cmd
      // FIXME: where's the 1002ms coming from?

      expect(run$.pipe(take(1))).to.equal('26s --(b|)')
    })

    it('makes tnt explosions every 5s', () => {
      events.config({
        arenaAvailable$: cold('b'),
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...PrimedAndReady.exitRequirements.map(req => req(events as any, arena)))

      expect(run$.pipe(take(5))).to.equal('26s --b 5s --b 5s --b 5s --b 5s --(b|)')
    })

    it('stops after 30 explosions', () => {
      events.config({
        arenaAvailable$: cold('b'),
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...PrimedAndReady.exitRequirements.map(req => req(events as any, arena)))

      // TODO: why no completion?
      const expected = '26s' + Array(30).join(' --b 5s') + ' --b'
      expect(run$).to.equal(expected)
    })

  })

})
