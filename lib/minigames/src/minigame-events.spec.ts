import { NoopLogger } from '@dandi/core'
import { silence } from '@ts-mc/common/rxjs'
import { impersonate, stubLoggerFactory } from '@ts-mc/common/testing'
import { requestClientFixture } from '@ts-mc/core/client/testing'
import { ServerEvent, ServerEventType } from '@ts-mc/core/server-events'
import { ServerEventFixtures } from '@ts-mc/core/server-events/testing'
import { PlayerWithHeldItems } from '@ts-mc/core/types'
import { TypesFixtures } from '@ts-mc/core/types/testing'
import { MinigameEvents } from '@ts-mc/minigames'
import { expect } from 'chai'
import { Observable } from 'rxjs'
import { map, mapTo, share } from 'rxjs/operators'

describe.marbles('MinigameEvents', ({ cold, hot }) => {

  stubLoggerFactory()

  let playerValues: { [key: string]: PlayerWithHeldItems }
  let serverEvents: { [key: string] : ServerEvent }

  function initEvents(source$: Observable<string>): MinigameEvents {
    const serverEvents$ = source$.pipe(
      map(key => serverEvents[key]),
      share(),
    )

    const events = new MinigameEvents(requestClientFixture(), serverEvents$, new NoopLogger())
    impersonate(events, function(this: MinigameEvents) {
      Object.values(playerValues || {}).forEach(player => this.addPlayer(player))
    })
    events.players.push(...Object.values(playerValues || {}))
    return events
  }

  beforeEach(() => {
    playerValues = {
      a: TypesFixtures.playerWithHeldItems({ name: 'kenny' }),
      b: TypesFixtures.playerWithHeldItems({ name: 'not-kenny' }),
    }
  })

  describe('playerDeath$', () => {

    it('emits when a player dies', () => {
      const source$ = hot('a')
      const expected =    'a'

      serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'kenny' }),
      }
      const events = initEvents(source$)

      expect(events.playerDeath$).with.marbleValues(serverEvents).to.equal(expected)
    })

    it('emits when multiple players die', () => {
      const source$ = hot('ab')
      const expected =    'ab'

      serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'kenny' }),
        b: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'not-kenny' }),
      }
      const events = initEvents(source$)

      expect(events.playerDeath$).with.marbleValues(serverEvents).to.equal(expected)
    })

    it('does not emit when non-player entities die', () => {
      const source$ = hot('a-b')
      const expected =    '-'

      serverEvents = {
        a: ServerEventFixtures.attackedEntity(ServerEventType.entityLivingDeath, { entityId: 'minecraft:cow' }),
        b: ServerEventFixtures.attackedEntity(),
      }
      const events = initEvents(source$)

      expect(events.playerDeath$).with.marbleValues(serverEvents).to.equal(expected)
    })

    it('does not emit when untracked players die', () => {
      const source$ = hot('a-b')
      const expected =    'a'

      serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'kenny' }),
        b: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'some-other-guy' }),
      }
      const events = initEvents(source$)

      expect(events.playerDeath$).with.marbleValues(serverEvents).to.equal(expected)
    })

    it('does not re-emit events after subsequent subscriptions', () => {
      const source$ =  hot('a')
      const expected1 =    'a'
      const expected2 =    '-'

      serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'kenny' }),
      }
      const events = initEvents(source$)

      expect(events.playerDeath$).with.marbleValues(serverEvents).to.equal(expected1)
      expect(events.playerDeath$).with.marbleValues(serverEvents).and.subscription('-^').to.equal(expected2)
    })
  })

  describe('playerLimbo$', () => {

    beforeEach(() => {
      serverEvents = {
        a: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'kenny' }),
        b: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: 'not-kenny' }),
      }
    })

    it('emits when a player dies', () => {
      const source$ = hot('ab')
      const expected =    'ab'

      const events = initEvents(source$)

      expect(events.playerLimbo$).with.marbleValues(playerValues).to.equal(expected)
    })

    it('re-emits events on subsequent subscriptions', () => {
      const source$ =  hot('ab')
      const expected1 =    'ab'
      const expected2 =    '--(ab)'
      const sub2 =         '--^'

      const events = initEvents(source$)

      expect(events.playerLimbo$, 'expected1').with.marbleValues(playerValues).to.equal(expected1)
      expect(events.playerLimbo$, 'expected2').with.marbleValues(playerValues).and.subscription(sub2).to.equal(expected2)
    })

    it('does not re-emit events for players that have respawned', () => {
      const source$ =  hot('abc')
      const expected1 =    'ab'
      const expected2 =    '---a'
      const sub2 =         '---^'

      serverEvents.c = ServerEventFixtures.player(
        ServerEventType.playerRespawn,
        { player: TypesFixtures.playerWithHeldItems(playerValues.b) },
      )

      const events = initEvents(source$)

      expect(events.playerLimbo$, 'expected1').with.marbleValues(playerValues).to.equal(expected1)
      expect(events.playerLimbo$, 'expected2').with.marbleValues(playerValues).and.subscription(sub2).to.equal(expected2)
    })

    it('does not re-emit events for players that have left the game', () => {
      const source$ =  hot('abc')
      const expected1 =    'ab'
      const expected2 =    '---a'
      const sub2 =         '---^'

      serverEvents.c = ServerEventFixtures.player(
        ServerEventType.playerLeft,
        { player: TypesFixtures.playerWithHeldItems(playerValues.b) },
      )

      const events = initEvents(source$)

      expect(events.playerLimbo$, 'expected1').with.marbleValues(playerValues).to.equal(expected1)
      expect(events.playerLimbo$, 'expected2').with.marbleValues(playerValues).and.subscription(sub2).to.equal(expected2)
    })

    describe('playerReady$', () => {

      it('emits when a player respawns after dying', () => {
        const source$ =  hot('bc')
        const expected =     '-b'

        serverEvents.c = ServerEventFixtures.player(
          ServerEventType.playerRespawn,
          { player: TypesFixtures.playerWithHeldItems(playerValues.b) },
        )

        const events = initEvents(source$)

        expect(events.playerReady$).with.marbleValues(playerValues).to.equal(expected)
      })

      it('emits when a player leaves after dying', () => {
        const source$ =  hot('bc')
        const expected =     '-b'

        serverEvents.c = ServerEventFixtures.player(
          ServerEventType.playerLeft,
          { player: TypesFixtures.playerWithHeldItems(playerValues.b) },
        )

        const events = initEvents(source$)

        expect(events.playerReady$).with.marbleValues(playerValues).to.equal(expected)
      })

    })

    describe('playersReady$', () => {

      it('emits when all players are respawned or leave the game after dying', () => {

        const source$ =  hot('--ab--cd')
        const expected =     'r-x----r'
        // start with true, emit false on first player death, then true when there are no longer any "limbo" players

        const readyValues = {
          r: true,
          x: false,
        }

        serverEvents.c = ServerEventFixtures.player(
          ServerEventType.playerRespawn,
          { player: TypesFixtures.playerWithHeldItems(playerValues.a) },
        )
        serverEvents.d = ServerEventFixtures.player(
          ServerEventType.playerLeft,
          { player: TypesFixtures.playerWithHeldItems(playerValues.b) },
        )

        const events = initEvents(source$)

        expect(events.playersReady$).with.marbleValues(readyValues).to.equal(expected)
      })

    })

  })

  describe('timedPlayerReadyEvent', () => {

    // logic used to time when the event happens - for example, when removing a block after 5 seconds, this would be an
    // observable that waits 5 seconds and then emits true
    let trigger$: Observable<string>

    // server events source - to simulates players dying and possibly respawning or leaving
    let source$: Observable<string>

    // expects that the resulting observable emits when the player respawns and not when trigger$ emits
    let expected: string

    function execTest() {
      const eventTrigger$: Observable<true> = trigger$.pipe(mapTo(true))
      const events = initEvents(source$)

      // run$ needs to be subscribed in order to correctly track the server events required to make
      // timedPlayerReadyEvent work. Pipe to silence so we don't have to worry about what actually gets emitted,
      // because it doesn't matter for these tests
      expect(events.run$.pipe(silence), 'run$').to.equal('')

      const timedEvent$ = cold('a').pipe(
        events.timedPlayerReadyEvent(() => eventTrigger$),
      )

      expect(timedEvent$, 'timedEvent$').to.equal(expected)
    }

    it('emits without further waiting if the timed event emits before a player dies', () => {
      trigger$ = cold('1s -x')
      source$ =   hot('1s --d')
      expected =      '1s -a'

      serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: playerValues.a.name }),
      }

      execTest()
    })

    it('delays emitting if a player dies before the timer emits', () => {
      trigger$ = cold('1s -x')
      source$ =   hot('1s d---r')
      expected =      '1s ----a'

      serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: playerValues.a.name }),
        r: ServerEventFixtures.player(ServerEventType.playerRespawn, { player: playerValues.a })
      }

      execTest()
    })

    it('delays emitting if a player leaves before the timer emits', () => {
      trigger$ = cold('1s -x')
      source$ =   hot('1s d---l')
      expected =      '1s ----a'

      serverEvents = {
        d: ServerEventFixtures.attackedByPlayer(ServerEventType.entityLivingDeath, { entityId: playerValues.a.name }),
        l: ServerEventFixtures.player(ServerEventType.playerLeft, { player: playerValues.a })
      }

      execTest()
    })
  })

})
