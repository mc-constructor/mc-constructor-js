import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import { requestClientFixture, RequestClientFixture } from '@ts-mc/core/client/testing'
import { CommandModule } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { playersFixture, PlayersFixture } from '@ts-mc/core/players/testing'
import { ServerEventType } from '@ts-mc/core/server-events'
import { createGameScope, MinigameEvents } from '@ts-mc/minigames'

import { expect } from 'chai'
import { NEVER } from 'rxjs'
import { map, tap } from 'rxjs/operators'

// FIXME: replace Codslap-specific classes with fixtures / test implementations
import { codslapEventsFixture, CodslapEventsFixture, codslapObjectivesFixture } from '../../../../minigames/codslap/testing'
import { Boring } from '../../../../minigames/codslap/src/arena/boring.arena'
import { KingOfTheHill } from '../../../../minigames/codslap/src/arena/king-of-the-hill.arena'
import { CodslapCommonCommands } from '../../../../minigames/codslap/src/codslap-common-commands'
import { CodslapEvents } from '../../../../minigames/codslap/src/codslap-events'
import { CodslapObjectives } from '../../../../minigames/codslap/src/codslap-objectives'
import { Codslap } from '../../../../minigames/codslap/src/codslap-static'

import { EventsAccessorProvider } from '../../src/events-accessor-provider'

import { ConfiguredArena, ConfiguredArenas } from './arena'
import { ArenaManager } from './arena-manager'
import { ArenasModuleBuilder } from './arenas-module-builder'
import { CommonCommands } from './common-commands'

describe.marbles('ArenaManager', ({ cold }) => {

  stubLoggerFactory()

  const harness = testHarness(
    ArenaManager,
    CommandModule,
    ConsoleLogListener,
    EventsAccessorProvider,
    {
      provide: RequestClient,
      useFactory: () => client,
    },
    {
      provide: CodslapEvents,
      useFactory: () => events,
    },
    {
      provide: MinigameEvents,
      useFactory: () => events,
    },
    {
      provide: CommonCommands,
      useClass: CodslapCommonCommands,
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
  let manager: ArenaManager<CodslapEvents>
  let arenas: ConfiguredArena<CodslapEvents>[]

  async function init() {
    const injector = harness.createChild(createGameScope)
    manager = await injector.inject<ArenaManager<CodslapEvents>>(ArenaManager)
    arenas = await injector.inject(ConfiguredArenas)
  }

  function registerSingleArena() {
    harness.register(
      new ArenasModuleBuilder('test')
        .arena(Boring, {
          entry: Codslap.requirements.none,
          exit: [
            Codslap.requirements.minArenaAge(30),
          ],
        }),
    )
  }

  function registerTwoArenas() {
    harness.register(
      new ArenasModuleBuilder('test')
        .arena(Boring, {
          entry: Codslap.requirements.none,
          exit: [
            Codslap.requirements.minArenaAge(30),
          ],
        })
        .arena(KingOfTheHill, {
          entry: [
            Codslap.requirements.minGameAge(35),
          ],
          exit: [
            () => NEVER,
          ],
        }),
    )
  }

  beforeEach(async () => {
    client = requestClientFixture()
    events = codslapEventsFixture()
    players = playersFixture()
    players.players.push({ name: 'testguy', uuid: '12345' })
  })
  afterEach(() => {
    client = undefined
    events = undefined
    players = undefined
    manager = undefined
    arenas = undefined
  })

  describe('ctr', () => {
    beforeEach(registerSingleArena)
    beforeEach(init)

    it.only('can be instantiated', () => {
      expect(manager).to.exist
    })
  })

  describe('run$', () => {

    describe('basic', () => {
      beforeEach(registerSingleArena)
      beforeEach(init)

      it('can be subscribed to', () => {
        const sub = manager.run$.subscribe()

        sub.unsubscribe()
      })

      it('starts the first arenas', () => {
        const values = {
          a: arenas[0]
        }
        client.config(cold('a'))

        // FIXME: where is the 2000ms delay coming from?
        const expectedStart = '2000ms -a'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(manager.run$, 'run$').to.equal('')
      })
    })

    describe('multiple commands', () => {
      beforeEach(registerTwoArenas)
      beforeEach(init)

      it('starts the first arenas', () => {
        const values = {
          a: arenas[0],
          b: arenas[1],
        }
        client.config(cold('a'))

        const expectedStart = '2000ms -a'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(manager.run$, 'run$').to.equal('')
      })

      it('starts the second arenas once it is ready and the first arenas completes its exit requirements', () => {
        const values = {
          a: arenas[0],
          b: arenas[1],
        }
        client.config(cold('a'), cold('b'))
        events.config({

          codslap$: cold('3500ms ' + Array(26).join('a')).pipe(
            map(() => ({
              type: ServerEventType.playerAttackEntity,
              player: { name: 'someguy' } as any,
            } as any)),
            tap(() => console.log('codslap!')),
          ),
        })

        const expectedStart = '2000ms -a 35999ms b'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(manager.run$, 'run$').and.marbleValues(values).to.equal('31s a')
      })
    })

  })

})
