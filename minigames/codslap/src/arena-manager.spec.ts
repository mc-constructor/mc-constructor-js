import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness } from '@dandi/core/testing'
import { CommonModule } from '@minecraft/core/common'
import { stubLoggerFactory } from '@minecraft/core/common/testing'
import { Players } from '@minecraft/core/players'
import { playersFixture, PlayersFixture } from '@minecraft/core/players/testing'
import { Client, ServerEventType } from '@minecraft/core/server'
import { clientFixture, ClientFixture } from '@minecraft/core/server/testing'

import { expect } from 'chai'
import { NEVER } from 'rxjs'
import { map, tap } from 'rxjs/operators'

import { codslapEventsFixture, CodslapEventsFixture, codslapObjectivesFixture } from '../testing'

import { Arena, ArenasModuleBuilder, ConfiguredArena, ConfiguredArenas } from './arena'
import { ArenaManager } from './arena-manager'
import { Boring } from './arena/boring.arena'
import { KingOfTheHill } from './arena/king-of-the-hill.arena'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { EventsAccessorProvider } from './events-accessor-provider'

describe.marbles('ArenaManager', ({ cold }) => {

  stubLoggerFactory()

  const harness = testHarness(
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
  let arenas: ConfiguredArena[]

  async function init() {
    manager = await harness.inject(ArenaManager)
    arenas = await harness.inject(ConfiguredArenas)
  }

  function registerSingleArena() {
    harness.register(
      new ArenasModuleBuilder()
        .arena(Boring, {
          entry: Arena.requirements.none,
          exit: [
            Arena.requirements.minArenaAge(30),
          ],
        }),
    )
  }

  function registerTwoArenas() {
    harness.register(
      new ArenasModuleBuilder()
        .arena(Boring, {
          entry: Arena.requirements.none,
          exit: [
            Arena.requirements.minArenaAge(30),
          ],
        })
        .arena(KingOfTheHill, {
          entry: [
            Arena.requirements.minGameAge(35),
          ],
          exit: [
            () => NEVER,
          ],
        }),
    )
  }

  beforeEach(async () => {
    client = clientFixture()
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

    it('can be instantiated', () => {
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

      it('starts the first arena', () => {
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

      it('starts the first arena', () => {
        const values = {
          a: arenas[0],
          b: arenas[1],
        }
        client.config(cold('a'))

        const expectedStart = '2000ms -a'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(manager.run$, 'run$').to.equal('')
      })

      it('starts the second arena once it is ready and the first arena completes its exit requirements', () => {
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
