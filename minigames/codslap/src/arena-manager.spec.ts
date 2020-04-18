import { stub, testHarness } from '@dandi/core/testing'
import { CommonModule, SubscriptionTracker } from '@minecraft/core/common'
import { stubLoggerFactory } from '@minecraft/core/common/testing'
import { Players } from '@minecraft/core/players'
import { playersFixture, PlayersFixture } from '@minecraft/core/players/testing'
import { Client } from '@minecraft/core/server'
import { clientFixture, ClientFixture } from '@minecraft/core/server/testing'
import { of } from 'rxjs'

import * as rxOps from 'rxjs/operators'

import { expect } from 'chai'
import { codslapEventsFixture, CodslapEventsFixture } from '../testing'
import { codslapObjectivesFixture } from '../testing/src/codslap-objectives.fixture'

import { ArenaManager } from './arena-manager'
import { Boring } from './arena/boring.arena'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { EventsAccessorProvider } from './events-accessor-provider'

describe('ArenaManager', () => {

  stubLoggerFactory()

  let harness = testHarness(
    ArenaManager,
    Boring,
    CommonCommands,
    CommonModule,
    EventsAccessorProvider,
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
  let manager: ArenaManager
  let subs: SubscriptionTracker

  beforeEach(async () => {
    stub(rxOps, 'delay').returns(() => of([]))

    client = clientFixture()
    events = codslapEventsFixture()
    players = playersFixture()
    manager = await harness.inject(ArenaManager)
    subs = await harness.inject(SubscriptionTracker)
  })
  afterEach(() => {
    client = undefined
    events = undefined
    players = undefined
    manager = undefined
    subs = undefined
  })

  it('can be instantiated', () => {
    expect(manager).to.exist
  })

  describe('run$', () => {
    it('can be subscribed to', () => {
      subs.track(harness as any, manager.run$.subscribe())
    })

    it.only('starts the first arena', async () => {
      const arenaStart = stub()
      client.send.returns(Promise.resolve())

      subs.track(harness as any,
        manager.arenaStart$.subscribe(arenaStart),
        manager.run$.subscribe(),
      )

      await new Promise(resolve => setTimeout(resolve, 1))

      expect(arenaStart).to.have.been.called
      const arena = arenaStart.firstCall.lastArg
      expect(arena).to.be.instanceof(Boring)
    })

  })

})
