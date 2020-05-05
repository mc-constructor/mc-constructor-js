import { stub } from '@dandi/core/testing'
import { NEVER, of } from 'rxjs'

import { expect } from 'chai'

import { TestCompiledRequest } from '../../testing'

describe.marbles('SimpleCompiledMessage', ({ cold }) => {

  it('emits a reference to itself from sent$ when sent$ is subscribed to', () => {
    const compiled = new TestCompiledRequest(true)
    const values = { a: compiled }
    const expected = '---(a|)'
    const sub =      '---^'

    expect(compiled.sent$).with.marbleValues(values).and.subscription(sub).to.equal(expected)
  })

  it('completes the sent$ observable after it has been sent', () => {
    const compiled = new TestCompiledRequest(true)
    const values = { a: compiled }
    const expected = '---(a|)'
    const expectedSentSub = '---^--!'

    expect(compiled.sent$).with.marbleValues(values).and.subscription(expectedSentSub).to.equal(expected)
  })

  it('emits the response of the message from pendingMessage$', () => {
    const response$ = cold('(a|)')
    const expected = '(a|)'
    const compiled = new TestCompiledRequest(true, response$)

    expect(compiled.pendingResponse$).to.equal(expected)
  })

  it('it completes without emitting if the message does not expect a response', () => {
    const compiled = new TestCompiledRequest(false)
    const expected = '|'
    const sub =      '^'

    expect(compiled.pendingResponse$).with.subscription(sub).to.equal(expected)
  })

  it('completes without emitting after the specified timeout if the message has a timeout on expecting a response', () => {
    const compiled = new TestCompiledRequest(5)
    stub(compiled, 'execute').callsFake(() => of(NEVER))
    const expected = '-----|'
    const sub =      '^'

    expect(compiled.pendingResponse$).with.subscription(sub).to.equal(expected)
  })

  it('includes the sent$ observable as a property of pendingMessage$', () => {
    const compiled = new TestCompiledRequest(true)
    expect(compiled.sent$).to.equal(compiled.pendingResponse$.sent$)
  })

})
