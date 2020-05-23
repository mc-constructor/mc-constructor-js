import { Logger } from '@dandi/core'
import { MarbleValues } from '@rxjs-marbles'
import { silence } from '@ts-mc/common/rxjs'
import { RequestClientFixture } from '@ts-mc/core/client/testing'
import { ServerEvent } from '@ts-mc/core/server-events'
import { ArenaAgeEvent, ArenaMinigameEvents } from '@ts-mc/minigames/arenas'
import { ArenaManagerFixture, arenaManagerFixture } from '@ts-mc/minigames/arenas/testing'
import { minigameEventsHelpers } from '@ts-mc/minigames/testing'
import { expect } from 'chai'
import { Observable } from 'rxjs'

describe.marbles('ArenaMinigameEvents', ({ hot }) => {

  const helpers = minigameEventsHelpers<ArenaMinigameEvents>({
    minigameEventsFactory: (requestClient: RequestClientFixture, serverEvents$: Observable<ServerEvent>, logger: Logger) =>
      new ArenaMinigameEvents(manager, requestClient, serverEvents$, logger)
  })

  let manager: ArenaManagerFixture

  beforeEach(() => {
    manager = arenaManagerFixture()
  })
  afterEach(() => {
    manager = undefined
  })

  describe('arenaAge$', () => {

    it('resets the arenaAge value for each new arena', () => {

      const arenaInit$ = hot('a 4s b 4s c') as Observable<any>
      const expected = 'abcdefghijk'.split('').join(' 999ms ')
      manager.config({ arenaInit$ })

      const events = helpers.initEvents(hot('-'))

      const expectedAges: MarbleValues<ArenaAgeEvent> = {
        a: {
          arenaAge: 0,
          minigameAge: 0,
        },
        b: {
          arenaAge: 1,
          minigameAge: 1,
        },
        c: {
          arenaAge: 2,
          minigameAge: 2,
        },
        d: {
          arenaAge: 3,
          minigameAge: 3,
        },
        e: {
          arenaAge: 4,
          minigameAge: 4,
        },
        f: {
          arenaAge: 0,
          minigameAge: 5,
        },
        g: {
          arenaAge: 1,
          minigameAge: 6,
        },
        h: {
          arenaAge: 2,
          minigameAge: 7,
        },
        i: {
          arenaAge: 3,
          minigameAge: 8,
        },
        j: {
          arenaAge: 0,
          minigameAge: 9,
        },
        k: {
          arenaAge: 1,
          minigameAge: 10,
        },
      }

      const arenaAge$ = events.arenaAge$

      expect(events.run$.pipe(silence)).with.subscription('^ 20s !').to.equal('-')
      expect(arenaAge$).with.marbleValues(expectedAges).and.subscription('^ 10s !').to.equal(expected)

    })

  })

})
