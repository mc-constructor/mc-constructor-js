import { ConsoleLogListener } from '@dandi/core/logging'
import { testHarness, stub } from '@dandi/core/testing'
import { range } from '@ts-mc/common'
import { silence } from '@ts-mc/common/rxjs'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import {
  CommandRequestFixture,
  requestClientFixture,
  RequestClientFixture,
} from '@ts-mc/core/client/testing'
import { CommandModule } from '@ts-mc/core/command'
import { ServerEventType } from '@ts-mc/core/server-events'
import { createGameScope, GameScope, MinigameEvents } from '@ts-mc/minigames'
import {
  ArenaManager,
  ArenaManagerEvents,
  ArenaMinigameEvents,
  ArenasModuleBuilder,
  CommonCommands,
  CommonCommandsBase,
  ConfiguredArena,
  ConfiguredArenas,
  Arena,
} from '@ts-mc/minigames/arenas'
import { minigameEventFixture } from '@ts-mc/minigames/testing'
import {
  arenaMinigameEventsFixture,
  ArenaMinigameEventsFixture,
  testArena,
  TestArenaMinigame
} from '@ts-mc/minigames/arenas/testing'

import { expect } from 'chai'
import { Observable, of } from 'rxjs'
import { mapTo } from 'rxjs/operators'
import { SinonStub } from 'sinon'

import { ArenaManagerEventsProxy } from './arena-manager-events-proxy'

type ArenaConfig = Pick<Arena<ArenaMinigameEvents>, 'entryRequirements' | 'exitRequirements'>

describe.marbles('ArenaManager', ({ cold, hot }) => {

  stubLoggerFactory()

  const harness = testHarness(
    ArenaManager,
    ArenaManagerEventsProxy,
    CommandModule,
    CommonCommandsBase,
    ConsoleLogListener,
    {
      provide: RequestClient,
      useFactory: () => client,
    },
    {
      provide: MinigameEvents,
      useFactory: (events: ArenaMinigameEvents) => events,
      deps: [ArenaMinigameEvents],
      restrictScope: GameScope,
    },
    ArenaManagerEventsProxy.provide(),
    {
      provide: ArenaMinigameEvents,
      useFactory: (managerEvents: ArenaManagerEvents<MinigameEvents>) => arenaMinigameEventsFixture(managerEvents),
      deps: [ArenaManagerEvents],
      restrictScope: GameScope,
    },
    {
      provide: CommonCommands,
      useFactory: (common: CommonCommandsBase) => common,
      deps: [CommonCommandsBase],
    },
  )

  let client: RequestClientFixture
  let events: ArenaMinigameEventsFixture
  let manager: ArenaManager<ArenaMinigameEvents>
  let arenas: ConfiguredArena<ArenaMinigameEvents>[]
  let arenaHooks: SinonStub<[], Observable<any>>[]
  let arenaMarbles: { [marble: string]: ConfiguredArena<ArenaMinigameEvents> }

  async function init(): Promise<void> {
    const injector = harness.createChild(createGameScope())
    manager = await injector.inject<ArenaManager<ArenaMinigameEvents>>(ArenaManager)

    events = (await injector.inject(ArenaMinigameEvents)) as unknown as ArenaMinigameEventsFixture
    events.players.push({ name: 'testguy', uuid: '12345' })

    arenas = await injector.inject(ConfiguredArenas)
    arenaMarbles = arenas.reduce((result, arena, index) => {
      result['abcdefghijklmnopqrstuvwxyz'[index]] = arena
      return result
    }, {} as { [marble: string]: ConfiguredArena<ArenaMinigameEvents> })
  }

  function registerArenas(count: number, config?: ArenaConfig): () => void {
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
          entry: index === 0 ? TestArenaMinigame.requirements.none : config?.entryRequirements as any || [
            TestArenaMinigame.requirements.count('playerDeath$', 25),
          ],
          exit: config?.exitRequirements as any || [
            TestArenaMinigame.requirements.minArenaAge(35),
          ]
        })
      }, new ArenasModuleBuilder('test'))
      harness.register(module)
      arenaHooks = testArenas.map(({ hook }) => hook)
    }
  }

  beforeEach(() => {
    client = requestClientFixture(cold('a'))
  })
  afterEach(() => {
    client = undefined
    events = undefined
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

        const expectedStart = '3s -a'

        expect(manager.run$, 'run$').with.subscription('^ 5s !').to.equal('-')
        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(values).to.equal(expectedStart)
      })
    })

    describe('multiple arenas', () => {
      beforeEach(registerArenas(2))
      beforeEach(init)

      it('starts the first arena', () => {
        client.config(cold('a'))

        const expectedStart = '3s -a'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(arenaMarbles).to.equal(expectedStart)
        expect(manager.run$, 'run$').with.marbleValues(arenaMarbles).to.equal('')
      })

      it('starts the second arena once it is ready and the first arena completes its exit requirements', () => {
        client.config(cold('a'), cold('b'))
        events.config({

          playerDeath$: minigameEventFixture(hot('5000ms ' + Array(26).join('a')).pipe(
            mapTo({
              type: ServerEventType.entityLivingDeath,
              player: { name: 'someguy' } as any,
            } as any),
          )),
        })

        const expectedStart = '3s -a 39999ms b'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(arenaMarbles).to.equal(expectedStart)
        expect(manager.run$.pipe(silence), 'run$').and.marbleValues(arenaMarbles).to.equal('70s |')
      })

      it('continues subscribing to hooks after exit requirements are complete', () => {
        const [hook] = arenaHooks
        const hook$ = cold('a')
        hook.onCall(26).returns(hook$)

        client.config(cold('a'))
        events.config({

          playerDeath$: minigameEventFixture(hot('3500ms ' + Array(26).join('a') + ' 27500ms aaa').pipe(
            mapTo({
              type: ServerEventType.entityLivingDeath,
              player: { name: 'someguy' } as any,
            } as any),
          )),
        })

        const expectedStart = '3s -a 39999ms b'

        expect(manager.arenaStart$, 'arenaStart$').with.marbleValues(arenaMarbles).to.equal(expectedStart)
        expect(manager.run$.pipe(silence), 'run$').and.marbleValues(arenaMarbles).to.equal('70s |')

        // 31026ms = sum of timings from playerDeath$ above:
        //  3500ms : initial delay
        //    25ms : 25 sequenced marble emits for exit reqs @ 1ms each
        // 27500ms : delay after prev sequence
        //     1ms : next sequence marble emit
        expect(hook$).to.have.been.subscribedWith('31026ms (^!)')
      })
    })

  })

  describe('arenaAvailable$', () => {

    beforeEach(registerArenas(2, { entryRequirements: [TestArenaMinigame.requirements.minGameAge(10)]}))
    beforeEach(init)

    it('emits when all entry requirements are met for an arena', () => {

      expect(manager.arenaAvailable$).with.marbleValues(arenaMarbles).to.equal('a 9999ms (b|)')

    })

    it('re-emits arenas that are ready but have not initialized on subsequent subscriptions', () => {

      const expected1 = 'a 9999ms (b|)'
      const expected2 = '5s a 4999ms (b|)'
      const sub2      = '5s ^'

      expect(manager.arenaAvailable$, 'expected1').with.marbleValues(arenaMarbles).to.equal(expected1)
      expect(manager.arenaAvailable$, 'expected2').with.marbleValues(arenaMarbles).and.subscription(sub2).to.equal(expected2)

    })

  })

})
