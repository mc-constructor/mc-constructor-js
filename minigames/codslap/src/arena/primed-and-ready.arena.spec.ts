import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import { requestClientFixture, RequestClientFixture } from '@ts-mc/core/client/testing'
import { CommandModule } from '@ts-mc/core/command'
import { createGameScope } from '@ts-mc/minigames'
import { Arena } from '@ts-mc/minigames/arenas'

import { expect } from 'chai'
import { merge, Observable } from 'rxjs'
import { take, tap } from 'rxjs/operators'

import { codslapEventsFixture, CodslapEventsFixture, codslapObjectivesFixture } from '../../testing'

import { CodslapEvents } from '../codslap-events'
import { CodslapObjectives } from '../codslap-objectives'
import { CodslapCommonCommands } from '../codslap-common-commands'

import { PrimedAndReady } from './primed-and-ready.arena'

describe('PrimedAndReadyArena', () => {

  stubLoggerFactory()

  const harness = testHarness(PrimedAndReady,
    CodslapCommonCommands.provide(),
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
      provide: CodslapObjectives,
      useFactory: codslapObjectivesFixture,
    }
  )

  let client: RequestClientFixture
  let events: CodslapEventsFixture
  let arena: Arena<CodslapEvents>

  beforeEach(async () => {
    client = requestClientFixture()
    events = codslapEventsFixture()
    events.players.push({ name: 'testguy', uuid: '12345' })
    const injector = harness.createChild(createGameScope())
    arena = (await injector.injectMulti<Arena<CodslapEvents>>(Arena))[0]
    arena.init()
  })
  afterEach(() => {
    client = undefined
    events = undefined
    arena = undefined
  })

  it('can be injected', () => {
    expect(arena).to.exist
  })

  describe.marbles('run', ({ cold }) => {

    it('starts making tnt explosions after the minDelay', () => {
      events.config({
        arenaAvailable$: cold('b') as Observable<any>,
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...arena.exitRequirements.map(req => req(events as any, arena)))

      // first boom = 10s minDelay + 5s delay after tnt cmd

      expect(run$.pipe(take(1))).to.equal('15s (b|)')
    })

    it('makes tnt explosions every 5s', () => {
      events.config({
        arenaAvailable$: cold('b') as Observable<any>,
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...arena.exitRequirements.map(req => req(events as any, arena)))

      expect(run$.pipe(take(5))).to.equal('15s b 4999ms b 4999ms b 4999ms b 4999ms (b|)')
    })

    it('stops after 30 explosions', () => {
      events.config({
        arenaAvailable$: cold('b') as Observable<any>,
      })
      events.timedPlayerReadyEvent.returns(tap())
      client.config(cold('b|'))

      const run$ = merge(...arena.exitRequirements.map(req => req(events as any, arena)))

      const expected = '15s' + Array(30).join(' b 4999ms') + ' (b|)'
      expect(run$).to.equal(expected)
    })

  })

})
