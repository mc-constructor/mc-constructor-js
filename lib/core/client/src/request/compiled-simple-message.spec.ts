import { stub } from '@dandi/core/testing'
import { stubLoggerFactory } from '@ts-mc/common/testing'
import { TestCompiledRequest } from '@ts-mc/core/client/testing'
import { expect } from 'chai'
import { NEVER, of } from 'rxjs'

describe.marbles('SimpleCompiledMessage', ({ cold }) => {

  stubLoggerFactory()

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

  it('emits undefined and completes immediately after sending if the message does not expect a response', () => {
    const compiled = new TestCompiledRequest(false)
    const expected = '(a|)'
    const values = {
      a: undefined as any,
    }

    expect(compiled.pendingResponse$).and.marbleValues(values).to.equal(expected)
  })

  it('emits undefined and completes after the specified timeout if the message has a timeout on expecting a response', () => {
    const compiled = new TestCompiledRequest(5)
    stub(compiled, 'execute').callsFake(() => of(NEVER))
    const expected = '-----(a|)'
    const values = {
      a: undefined as any,
    }

    expect(compiled.pendingResponse$).with.marbleValues(values).to.equal(expected)
  })

  it('includes the sent$ observable as a property of pendingMessage$', () => {
    const compiled = new TestCompiledRequest(true)
    expect(compiled.sent$).to.equal(compiled.pendingResponse$.sent$)
  })

})
