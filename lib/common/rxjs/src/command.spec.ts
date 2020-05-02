import { testHarness } from '@dandi/core/testing'
import { expect } from 'chai'

import { parallel } from '../../../command'
import { Client } from '../../../server'
import { ClientFixture, clientFixture, TestCommand } from '../../../server/testing'

import { stubLoggerFactory } from '../../testing'

import { CommandOperator, CommandOperatorFn, CommandOperatorProvider } from './command'

describe.marbles('command operator', ({ cold }) => {

  stubLoggerFactory()

  const harness = testHarness(
    CommandOperatorProvider,
    {
      provide: Client,
      useFactory: () => client,
    },
  )

  let client: ClientFixture
  let command: CommandOperatorFn

  beforeEach(async () => {
    client = clientFixture()
    command = await harness.inject(CommandOperator)
  })

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
