import { MarbleKey, MarbleValues } from '@rxjs-stuff/marbles'
import { silence } from '@ts-mc/common/rxjs'
import { ServerEvent, ServerEventType } from '@ts-mc/core/server-events'
import { ServerEventFixtures, serverEventsFixture } from '@ts-mc/core/server-events/testing'
import { TypesFixtures } from '@ts-mc/core/types/testing'
import { MinigameAgeEvent, MinigameEvents } from '@ts-mc/minigames'
import { minigameEventsHelpers } from '@ts-mc/minigames/testing'
import { expect } from 'chai'
import { Observable } from 'rxjs'
import { mapTo, tap } from 'rxjs/operators'

describe.marbles('MinigameEvents', ({ cold, hot }) => {

  const helpers = minigameEventsHelpers({
    playerValues: () => ({
      a: TypesFixtures.playerWithHeldItems({ name: 'kenny' }),
      b: TypesFixtures.playerWithHeldItems({ name: 'not-kenny' }),
    })
  })

  describe('playerDeath$', () => {

    it('emits when a player dies', () => {
      helpers.serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'kenny' }),
      }

      const source$ = hot('a', helpers.serverEvents)
      const expected =    'a'
      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerDeath$).with.marbleValues(helpers.serverEvents).to.equal(expected)
    })

    it('emits when multiple players die', () => {
      helpers.serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'kenny' }),
        b: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'not-kenny' }),
      }

      const source$ = hot('ab', helpers.serverEvents)
      const expected =    'ab'
      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerDeath$).with.marbleValues(helpers.serverEvents).to.equal(expected)
    })

    it('does not emit when non-player entities die', () => {
      helpers.serverEvents = {
        a: ServerEventFixtures.attackedEntity(ServerEventType.livingDeath, { entityId: 'minecraft:cow' }),
        b: ServerEventFixtures.attackedEntity(),
      }

      const source$ = hot('a-b', helpers.serverEvents)
      const expected =    '-'
      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerDeath$).with.marbleValues(helpers.serverEvents).to.equal(expected)
    })

    it('does not emit when untracked players die', () => {

      helpers.serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'kenny' }),
        b: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'some-other-guy' }),
      }
      const source$ = hot('a-b', helpers.serverEvents)
      const expected =    'a'
      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerDeath$).with.marbleValues(helpers.serverEvents).to.equal(expected)
    })

    it('does not re-emit events after subsequent subscriptions', () => {

      helpers.serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'kenny' }),
      }
      const source$ =  hot('a', helpers.serverEvents)
      const expected1 =    'a'
      const expected2 =    '-'
      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerDeath$).with.marbleValues(helpers.serverEvents).to.equal(expected1)
      expect(events.playerDeath$).with.marbleValues(helpers.serverEvents).and.subscription('-^').to.equal(expected2)
    })
  })

  describe('playerLimbo$', () => {

    beforeEach(() => {
      helpers.serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'kenny' }),
        b: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: 'not-kenny' }),
      }
    })

    it('emits when a player dies', () => {
      const source$ = hot('ab', helpers.serverEvents)
      const expected =    'ab'

      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerLimbo$).with.marbleValues(helpers.playerValues).to.equal(expected)
    })

    it('re-emits events on subsequent subscriptions', () => {
      const source$ =  hot('ab', helpers.serverEvents)
      const expected1 =    'ab'
      const expected2 =    '--(ab)'
      const sub2 =         '--^'

      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerLimbo$, 'expected1').with.marbleValues(helpers.playerValues).to.equal(expected1)
      expect(events.playerLimbo$, 'expected2').with.marbleValues(helpers.playerValues).and.subscription(sub2).to.equal(expected2)
    })

    it('does not re-emit events for players that have respawned', () => {
      helpers.serverEvents.c = ServerEventFixtures.player(
        ServerEventType.playerRespawn,
        { player: TypesFixtures.playerWithHeldItems(helpers.playerValues.b) },
      )

      const source$ =  hot('abc', helpers.serverEvents)
      const expected1 =    'ab'
      const expected2 =    '---a'
      const sub2 =         '---^'

      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerLimbo$, 'expected1').with.marbleValues(helpers.playerValues).to.equal(expected1)
      expect(events.playerLimbo$, 'expected2').with.marbleValues(helpers.playerValues).and.subscription(sub2).to.equal(expected2)
    })

    it('does not re-emit events for players that have left the game', () => {
      helpers.serverEvents.c = ServerEventFixtures.player(
        ServerEventType.playerLeft,
        { player: TypesFixtures.playerWithHeldItems(helpers.playerValues.b) },
      )

      const source$ =  hot('abc', helpers.serverEvents)
      const expected1 =    'ab'
      const expected2 =    '---a'
      const sub2 =         '---^'

      const events = helpers.initEvents(serverEventsFixture(source$))

      expect(events.playerLimbo$, 'expected1').with.marbleValues(helpers.playerValues).to.equal(expected1)
      expect(events.playerLimbo$, 'expected2').with.marbleValues(helpers.playerValues).and.subscription(sub2).to.equal(expected2)
    })

    describe('playerReady$', () => {

      it('emits when a player respawns after dying', () => {
        helpers.serverEvents.c = ServerEventFixtures.player(
          ServerEventType.playerRespawn,
          { player: TypesFixtures.playerWithHeldItems(helpers.playerValues.b) },
        )

        const source$ =  hot('bc', helpers.serverEvents)
        const expected =     '-b'

        const events = helpers.initEvents(serverEventsFixture(source$))

        expect(events.playerReady$).with.marbleValues(helpers.playerValues).to.equal(expected)
      })

      it('emits when a player leaves after dying', () => {
        helpers.serverEvents.c = ServerEventFixtures.player(
          ServerEventType.playerLeft,
          { player: TypesFixtures.playerWithHeldItems(helpers.playerValues.b) },
        )

        const source$ =  hot('bc', helpers.serverEvents)
        const expected =     '-b'

        const events = helpers.initEvents(serverEventsFixture(source$))

        expect(events.playerReady$).with.marbleValues(helpers.playerValues).to.equal(expected)
      })

    })

    describe('playersReady$', () => {

      it('emits when all players are respawned or leave the game after dying', () => {
        helpers.serverEvents.c = ServerEventFixtures.player(
          ServerEventType.playerRespawn,
          { player: TypesFixtures.playerWithHeldItems(helpers.playerValues.a) },
        )
        helpers.serverEvents.d = ServerEventFixtures.player(
          ServerEventType.playerLeft,
          { player: TypesFixtures.playerWithHeldItems(helpers.playerValues.b) },
        )

        const source$ =  hot('--ab--cd', helpers.serverEvents)
        const expected =     'r-x----r'
        // start with true, emit false on first player death, then true when there are no longer any "limbo" players

        const readyValues = {
          r: true,
          x: false,
        }

        const events = helpers.initEvents(serverEventsFixture(source$))

        expect(events.playersReady$).with.marbleValues(readyValues).to.equal(expected)
      })

    })

  })

  describe('timedPlayerReadyEvent', () => {

    // logic used to time when the event happens - for example, when removing a block after 5 seconds, this would be an
    // observable that waits 5 seconds and then emits true
    let trigger$: Observable<MarbleKey>

    // server events source - to simulates players dying and possibly respawning or leaving
    let source$: Observable<ServerEvent>

    // expects that the resulting observable emits when the player respawns and not when trigger$ emits
    let expected: string

    function execTest(timedEventSource$: Observable<string> = cold('a')) {
      const eventTrigger$: Observable<true> = trigger$.pipe(mapTo(true))
      const events = helpers.initEvents(serverEventsFixture(source$))

      // run$ needs to be subscribed in order to correctly track the server events required to make
      // timedPlayerReadyEvent work. Pipe to silence so we don't have to worry about what actually gets emitted,
      // because it doesn't matter for these tests
      expect(events.run$.pipe(silence()), 'run$').with.subscription('^ 10s !').to.equal('')

      const timedEvent$ = timedEventSource$.pipe(
        tap(v => console.log('event', v)),
        events.timedPlayerReadyEvent(() => eventTrigger$),
        tap(v => console.log('ready event', v))
      )

      expect(timedEvent$, 'timedEvent$').to.equal(expected)
    }

    it('emits without further waiting if the timed event emits before a player dies', () => {
      helpers.serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: helpers.playerValues.a.name }),
      }

      trigger$ = cold('1s -x')
      source$ =   hot('1s --d', helpers.serverEvents)
      expected =      '1s -a'

      execTest()
    })

    it('delays emitting if a player dies before the timer emits', () => {
      helpers.serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: helpers.playerValues.a.name }),
        r: ServerEventFixtures.player(ServerEventType.playerRespawn, { player: helpers.playerValues.a })
      }

      trigger$ = cold('1s -x')
      source$ =   hot('1s d---r', helpers.serverEvents)
      expected =      '1s ----a'

      execTest()
    })

    it('delays emitting if a player leaves before the timer emits', () => {
      helpers.serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: helpers.playerValues.a.name }),
        l: ServerEventFixtures.player(ServerEventType.playerLeft, { player: helpers.playerValues.a })
      }

      trigger$ = cold('1s -x')
      source$ =   hot('1s d---l', helpers.serverEvents)
      expected =      '1s ----a'

      execTest()
    })

    it('continues emitting over multiple source events', () => {
      helpers.serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: helpers.playerValues.a.name }),
        r: ServerEventFixtures.player(ServerEventType.playerRespawn, { player: helpers.playerValues.a })
      }

      trigger$ = cold('1s -x')
      source$ =   hot('1s d---r', helpers.serverEvents)
      expected =      '1s ----a 1s b 1s c 1s d'

      execTest(cold('a 1s b 1s c 1s d'))
    })

    it('continues emitting over multiple source events with multiple interruptions', () => {
      helpers.serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.livingDeath, { entityId: helpers.playerValues.a.name }),
        r: ServerEventFixtures.player(ServerEventType.playerRespawn, { player: helpers.playerValues.a })
      }

      trigger$ =    cold('1s   -x')
      source$ =      hot('1s   d---r 1s d---r 1s d---r 1s d---r', helpers.serverEvents)
      expected =         '1s   ----a 1s ----b 1s ----c 1s ----d'
      const emit$ = cold<string>('a 1s         b 1s c 1s d')

      execTest(emit$)
    })
  })

  describe('minigameAge$', () => {

    let events: MinigameEvents
    let expectedAges: MarbleValues<MinigameAgeEvent>
    let minigameAge$: Observable<MinigameAgeEvent>
    let expectMinigameAge: () => Chai.Assertion

    beforeEach(() => {
      events = helpers.initEvents(serverEventsFixture(cold('-')))
      expectedAges = {
        a: {
          minigameAge: 0,
        },
        b: {
          minigameAge: 1,
        },
        c: {
          minigameAge: 2,
        },
        d: {
          minigameAge: 3,
        },
        e: {
          minigameAge: 4,
        }
      }
      minigameAge$ = events.minigameAge$
      expectMinigameAge = () => expect(minigameAge$).with.marbleValues(expectedAges)
    })

    // IMPORTANT : marble testing this MUST use subscription marbles to control the subscriptions because
    //             minigameAge$ will not end on its own!

    it('emits every second', () => {
      expectMinigameAge().with.subscription('^ 4999ms !').to.equal('a 999ms b 999ms c 999ms d 999ms e')
    })

    it('emits the same values to multiple subscribers', () => {
      expectMinigameAge().with.subscription('^ 4999ms !').to.equal('a 999ms b 999ms c 999ms d 999ms e')
      expectMinigameAge().with.subscription('^ 4999ms !').to.equal('a 999ms b 999ms c 999ms d 999ms e')
      expectMinigameAge().with.subscription('2999ms ^ 2s !').to.equal('3s d 999ms e')
    })

    it('runs on its own when run$ is subscribed to, and emits the correct values to direct subscribers', () => {
      expect(events.run$.pipe(silence())).with.subscription('^ 20s !').to.equal('')
      expectMinigameAge().with.subscription('2999ms ^ 2s !').to.equal('3s d 999ms e')
    })

  })

})
