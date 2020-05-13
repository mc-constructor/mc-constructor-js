import { testHarness } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { RequestClient } from '@ts-mc/core/client'
import { RequestClientFixture, TestCommand, requestClientFixture } from '@ts-mc/core/client/testing'
import { expect } from 'chai'

import { CommandOperatorProvider, CommandOperatorFn, CommandOperator } from './command-operator'
import { parallel } from './multi-command-request'

describe.marbles('command operator', ({ cold }) => {

  stubLoggerFactory()

  const harness = testHarness(
    CommandOperatorProvider,
    {
      provide: RequestClient,
      useFactory: () => client,
    },
  )

  let client: RequestClientFixture
  let command: CommandOperatorFn

  beforeEach(async () => {
    client = requestClientFixture()
    command = await harness.inject(CommandOperator)
  })

  describe('explicitly passed commands', () => {

    it('executes a single basic command', () => {
      const response$ = cold('a')
      const test$ = cold('a').pipe(
        command(() => new TestCommand(true, 'a')),
      )

      client.config(response$)

      expect(test$).to.equal('a')
    })

    it('executes a parallel multi command that actually only has one command', () => {
      const response$ = cold('a|')
      const test$ = cold('a|').pipe(
        command(() => parallel(new TestCommand(true, 'a'))),
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
        command(() => parallel(new TestCommand(true, 'a'), new TestCommand(true, 'b'))),
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
