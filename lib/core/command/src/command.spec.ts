import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import { RequestClientFixture, TestCommand, requestClientFixture } from '@ts-mc/core/client/testing'
import { expect } from 'chai'

import { MapCommandProvider, MapCommandOperatorFn, MapCommand } from './map-command'
import { parallel } from './multi-command-request'

describe.marbles('command operator', ({ cold }) => {

  stubLoggerFactory()

  const harness = testHarness(
    MapCommandProvider,
    {
      provide: RequestClient,
      useFactory: () => client,
    },
  )

  let client: RequestClientFixture
  let mapCommand: MapCommandOperatorFn

  beforeEach(async () => {
    client = requestClientFixture()
    mapCommand = await harness.inject(MapCommand)
  })

  describe('explicitly passed commands', () => {

    it('executes a single basic command', () => {
      const response$ = cold('a')
      const test$ = cold('a').pipe(
        mapCommand(() => new TestCommand(true, 'a')),
      )

      client.config(response$)

      expect(test$).to.equal('a')
    })

    it('executes a parallel multi command that actually only has one command', () => {
      const response$ = cold('a|')
      const test$ = cold('a|').pipe(
        mapCommand(() => parallel(new TestCommand(true, 'a'))),
      )
      const values = {
        a: ['a'],
      }

      client.config(response$)

      expect(test$).with.marbleValues(values).to.equal('a|')
    })

    it('executes a parallel multi command with multiple commands', () => {
      const response$ = [cold('a|'), cold('b|')]
      const test$ = cold('x|').pipe(
        mapCommand(() => parallel(new TestCommand(true, 'a'), new TestCommand(true, 'b'))),
      )
      const values = {
        a: 'a',
        b: 'b',
        r: ['a', 'b'],
      }

      client.config(response$, values)

      expect(test$).with.marbleValues(values).to.equal('r|')
    })

  })

})
