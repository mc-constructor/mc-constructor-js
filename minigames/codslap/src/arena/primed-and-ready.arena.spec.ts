import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import { requestClientFixture, RequestClientFixture } from '@ts-mc/core/client/testing'
import { CommandModule } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { playersFixture, PlayersFixture } from '@ts-mc/core/players/testing'
import { Arena } from '@ts-mc/minigames/arenas'

import { expect } from 'chai'
import { merge } from 'rxjs'
import { take, tap } from 'rxjs/operators'

import { codslapEventsFixture, CodslapEventsFixture, codslapObjectivesFixture } from '../../testing'

import { CodslapEvents } from '../codslap-events'
import { CodslapObjectives } from '../codslap-objectives'
import { CodslapCommonCommands } from '../codslap-common-commands'

import { PrimedAndReady } from './primed-and-ready.arena'

describe('PrimedAndReadyArena', () => {

  stubLoggerFactory()

  const harness = testHarness(PrimedAndReady,
    CodslapCommonCommands,
    CommandModule,
    ConsoleLogListener,
    {
      provide: RequestClient,
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

  let client: RequestClientFixture
  let events: CodslapEventsFixture
  let players: PlayersFixture
  let arena: Arena<CodslapEvents>

  beforeEach(async () => {
    client = requestClientFixture()
    events = codslapEventsFixture()
    players = playersFixture()
    players.players.push({ name: 'testguy', uuid: '12345' })
    arena = (await harness.injectMulti<Arena<CodslapEvents>>(Arena))[0]
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

      const run$ = merge(...arena.exitRequirements.map(req => req(events as any, arena)))

      // first boom = 20s minDelay + 5s delay after tnt cmd
      // FIXME: where's the 100ms coming from?

      expect(run$.pipe(take(1))).to.equal('26s (b|)')
    })

    it('makes tnt explosions every 5s', () => {
      events.config({
        arenaAvailable$: cold('b'),
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...arena.exitRequirements.map(req => req(events as any, arena)))

      expect(run$.pipe(take(5))).to.equal('26s b 4999ms b 4999ms b 4999ms b 4999ms (b|)')
    })

    it('stops after 30 explosions', () => {
      events.config({
        arenaAvailable$: cold('b'),
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...arena.exitRequirements.map(req => req(events as any, arena)))

      // TODO: why no completion?
      const expected = '26s' + Array(30).join(' b 4999ms') + ' b'
      expect(run$).to.equal(expected)
    })

  })

})
