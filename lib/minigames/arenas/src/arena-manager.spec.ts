import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness, stub } from '@dandi/core/testing'
import { range } from '@ts-mc/common'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import {
  CommandRequestFixture,
  requestClientFixture,
  RequestClientFixture,
} from '@ts-mc/core/client/testing'
import { CommandModule } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { playersFixture, PlayersFixture } from '@ts-mc/core/players/testing'
import { ServerEventType } from '@ts-mc/core/server-events'
import { createGameScope, MinigameEvents } from '@ts-mc/minigames'
import { ArenaMinigameEvents, CommonCommands, CommonCommandsBase } from '@ts-mc/minigames/arenas'
import {
  arenaMinigameEventsFixture,
  ArenaMinigameEventsFixture,
  testArena,
  TestArenaMinigame
} from '@ts-mc/minigames/arenas/testing'

import { expect } from 'chai'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'

import { EventsAccessorProvider } from '../../src/events-accessor-provider'

import { ConfiguredArena, ConfiguredArenas } from './arena'
import { ArenaManager } from './arena-manager'
import { ArenasModuleBuilder } from './arenas-module-builder'
import { SinonStub } from 'sinon'
import { minigameEventFixture } from '@ts-mc/minigames/testing'

describe.marbles.only('ArenaManager', ({ cold, hot }) => {

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
      provide: MinigameEvents,
      useFactory: () => events,
    },
    {
      provide: ArenaMinigameEvents,
      useFactory: () => events,
    },
    {
      provide: CommonCommandsBase,
      useFactory: (players: Players) => new CommonCommandsBase(players),
      deps: [Players],
    },
    {
      provide: CommonCommands,
      useFactory: (common: CommonCommandsBase) => common,
      deps: [CommonCommandsBase],
    },
    {
      provide: Players,
      useFactory: () => players,
    },
  )

  let client: RequestClientFixture
  let events: ArenaMinigameEventsFixture
  let players: PlayersFixture
  let manager: ArenaManager<ArenaMinigameEvents>
  let arenas: ConfiguredArena<ArenaMinigameEvents>[]
  let arenaHooks: SinonStub<[], Observable<any>>[]

  async function init() {
    const injector = harness.createChild(createGameScope())
    manager = await injector.inject<ArenaManager<ArenaMinigameEvents>>(ArenaManager)
    arenas = await injector.inject(ConfiguredArenas)
  }

  function registerArenas(count: number) {
    return () => {
      const testArenas = range(1, count).map(index => {

        const hook = stub<[], Observable<any>>().returns(of(undefined))
        const arena = testArena(`TestArena${index}`, {
          hooks: {
            playerDeath$: [
              () => new CommandRequestFixture(`TestArena${index}Hook`, hook),
            ],
          },
        })
        return { hook, arena }
      })
      const module = testArenas.reduce((result, { arena }, index) => {
        return result.arena(arena, {
          entry: index === 0 ? TestArenaMinigame.requirements.none : [
            TestArenaMinigame.requirements.minGameAge(35 * index),
          ],
          exit: [
            TestArenaMinigame.requirements.minArenaAge(30),
            TestArenaMinigame.requirements.count('playerDeath$', 25),
          ]
        })
      }, new ArenasModuleBuilder('test'))
      harness.register(module)
      arenaHooks = testArenas.map(({ hook }) => hook)
    }
  }

  beforeEach(async () => {
    client = requestClientFixture()
    events = arenaMinigameEventsFixture()
    players = playersFixture()
    players.players.push({ name: 'testguy', uuid: '12345' })
  })
  afterEach(() => {
    client = undefined
    events = undefined
    players = undefined
    manager = undefined
    arenas = undefined
    arenaHooks = undefined
  })

  describe('ctr', () => {
    beforeEach(registerArenas(1))
    beforeEach(init)

    it('can be instantiated', () => {
      expect(manager).to.exist
    })
  })

  describe('run$', () => {

    describe('basic', () => {
      beforeEach(registerArenas(1))
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

        const expectedStart = '2500ms -a'

        expect(manager.run$, 'run$').to.equal('')
        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
      })
    })

    describe('multiple arenas', () => {
      beforeEach(registerArenas(2))
      beforeEach(init)

      let values: any

      beforeEach(() => {
        values = {
          a: arenas[0],
          b: arenas[1],
        }
      })

      it('starts the first arena', () => {
        client.config(cold('a'))

        const expectedStart = '2500ms -a'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(manager.run$, 'run$').with.marbleValues(values).to.equal('')
      })

      it('starts the second arena once it is ready and the first arena completes its exit requirements', () => {
        client.config(cold('a'), cold('b'))
        events.config({

          playerDeath$: minigameEventFixture(hot('5000ms ' + Array(26).join('a')).pipe(
            map(() => ({
              type: ServerEventType.entityLivingDeath,
              player: { name: 'someguy' } as any,
            } as any)),
          )),
        })

        const expectedStart = '2500ms -a 41499ms b'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(manager.run$, 'run$').and.marbleValues(values).to.equal('36s a')
      })

      it('continues subscribing to hooks after exit requirements are complete', () => {
        const [hook] = arenaHooks
        const hook$ = cold('a')
        hook.onCall(26).returns(hook$)

        client.config(cold('a'), cold('b'))
        events.config({

          playerDeath$: minigameEventFixture(hot('3500ms ' + Array(26).join('a') + ' 26500ms aaa').pipe(
            map(() => ({
              type: ServerEventType.entityLivingDeath,
              player: { name: 'someguy' } as any,
            } as any)),
          )),
        })

        const expectedStart = '2500ms -a 41499ms b'

        expect(manager.run$, 'run$').and.marbleValues(values).to.equal('36s a 31s')
        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
        expect(hook$).to.have.been.subscribedWith('32526ms (^!)')
      })
    })

  })

})
