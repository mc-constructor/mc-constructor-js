import { ConsoleLogListener } from '@dandi/core/logging'
import { stub, testHarness } from '@dandi/core/testing'
import { CommonModule } from '@minecraft/core/common'
import { SubscriptionTracker } from '@minecraft/core/common/rxjs'
import { stubLoggerFactory } from '@minecraft/core/common/testing'
import { Players } from '@minecraft/core/players'
import { playersFixture, PlayersFixture } from '@minecraft/core/players/testing'
import { Client } from '@minecraft/core/server'
import { clientFixture, ClientFixture } from '@minecraft/core/server/testing'

import { of } from 'rxjs'
import * as rxOps from 'rxjs/operators'

import { expect } from 'chai'
import { codslapEventsFixture, CodslapEventsFixture, codslapObjectivesFixture } from '../testing'

import { Arena, ArenasModuleBuilder } from './arena'
import { ArenaManager } from './arena-manager'
import { Boring } from './arena/boring.arena'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { EventsAccessorProvider } from './events-accessor-provider'

describe.marbles('ArenaManager', ({ cold, ...helper }) => {

  stubLoggerFactory()

  let harness = testHarness(
    new ArenasModuleBuilder()
      .arena(Boring, {
        entry: Arena.requirements.none,
        exit: [
          Arena.requirements.minArenaAge(30),
        ],
      }),
    ArenaManager,
    CommonCommands,
    CommonModule,
    ConsoleLogListener,
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

    it('starts the first arena', () => {
      client.send.returns(Promise.resolve())
      const values = {
        a: Boring
      }

      const expectedRun = 'a'
      const startSub = '^'

      const runSub = manager.run$.subscribe()

      expect(manager.arenaStart$).with.subscription(startSub).and.marbleValues(values).to.equal(expectedRun)

      // const runSub = manager.run$.subscribe()
      // subs.track(harness as any,
      //   manager.arenaStart$.subscribe(arenaStart),
      //   runSub,
      // )

      // expect(arenaStart).to.have.been.calledOnce
      // const arena = arenaStart.firstCall.lastArg
      // expect(arena).to.be.instanceof(Boring)
      //
      runSub.unsubscribe()

      // FIXME: first arena gets repeated due to queuedReplay behavior - how should that be fixed?
    })

  })

})
