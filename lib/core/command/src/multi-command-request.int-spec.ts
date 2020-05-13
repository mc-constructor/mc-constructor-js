import { stubLoggerFactory } from '@ts-mc/common/testing'
import { requestClientFixture } from '@ts-mc/core/client/testing'
import { title, wait, rawCmd, block, tellraw } from '@ts-mc/core/cmd'
import { Block, loc } from '@ts-mc/core/types'
import { expect } from 'chai'

import { parallel, series } from './multi-command-request'

describe.marbles('Integration: MultiCommandRequest', ({ cold }) => {

  stubLoggerFactory()

  it('completes when using wait commands', () => {

    const client = requestClientFixture()

    const test$ = series(
      wait(100),
      wait(200),
    ).execute(client)

    const values = {
      a: [undefined, undefined] as any[],
    }

    const expected = '300ms (a|)'

    expect(test$).with.marbleValues(values).to.equal(expected)
  })

  it('completes when mixing wait commands with raw commands', () => {

    const clientResponses = [
      cold('a|'),
    ]

    const responseValues = {
      a: [
        'commands.teleport.success.location.single',
        'someguy',
        '-99.5',
        '222.0',
        '0.5',
      ],
    }

    const client = requestClientFixture(clientResponses, responseValues)

    const test$ = series(
      wait(100),
      rawCmd('teleport someguy -100 222 0'),
      wait(200),
    ).execute(client)

    const values = {
      a: [
        undefined,
        responseValues.a,
        undefined,
      ],
    }

    const expected = '300ms (a|)'

    expect(test$).with.marbleValues(values).to.equal(expected)

  })

  it('completes when mixing wait commands with non-response commands', () => {

    const clientResponses = [
      cold('a|'),
    ]

    const responseValues = {
      a: undefined as any,
    }

    const client = requestClientFixture(clientResponses, responseValues)

    const test$ = series(
      wait(100),
      tellraw('@a', 'sup'),
      wait(200),
    ).execute(client)

    const values = {
      a: [
        undefined,
        responseValues.a,
        undefined,
      ],
    }

    const expected = '300ms (a|)'

    expect(test$).with.marbleValues(values).to.equal(expected)
  })

  it('completes when mixing wait commands with response commands', () => {

    const clientResponses = [
      cold('a|'),
    ]

    const responseValues = {
      a: 'setblock success',
    }

    const client = requestClientFixture(clientResponses, responseValues)

    const test$ = series(
      wait(100),
      block(Block.lava).set(loc(0, 0, 0)),
      wait(200),
    ).execute(client)

    const values = {
      a: [
        undefined,
        responseValues.a,
        undefined,
      ],
    }

    const expected = '300ms (a|)'

    expect(test$).with.marbleValues(values).to.equal(expected)
  })

  it('completes when mixing wait commands with timeout commands', () => {

    const client = requestClientFixture()

    const test$ = series(
      wait(100),
      rawCmd('whatever', 2000),
      wait(200),
    ).execute(client)

    const values = {
      a: [undefined, undefined, undefined] as any[],
    }

    const expected = '2300ms (a|)'

    expect(test$).with.marbleValues(values).to.equal(expected)
  })

  it('completes with nested multi commands', () => {

    const client = requestClientFixture(cold('a'))

    const test$ = parallel(
      series(
        wait(100),
        title('@a', 'Hi!', 'sup'),
      ),
      rawCmd('teleport somebody somewhere'),
      rawCmd('do something else', 2000),
    ).execute(client)

    const expected = '100ms (a|)'

    const values = {
      a: [
        'a',
        'a',
        [
          undefined,
          [
            'a',
            'a',
            'a',
          ],
        ],
      ],
    }

    expect(test$).with.marbleValues(values).to.equal(expected)
  })

})
