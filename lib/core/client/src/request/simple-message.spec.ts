import { stubLoggerFactory } from '@ts-mc/common/testing'
import { requestClientFixture, TestSimpleRequest } from '@ts-mc/core/client/testing'
import { expect } from 'chai'

describe('SimpleRequest', () => {

  stubLoggerFactory()

  describe('compileRequest', () => {
    it('creates a CompiledRequest instance that sends the correct values to client.send', () => {
      const client = requestClientFixture()
      const msg = new TestSimpleRequest('hi', true)
      const compiled = msg.compileRequest(client)

      const sub = compiled.pendingResponse$.subscribe()

      expect(client.send).to.have.been.calledOnceWithExactly(msg.type, 'hi', true)

      sub.unsubscribe()
    })
  })

  describe.marbles('response handling', ({ cold }) => {

    describe('with hasResponse === true', () => {

      it('does not emit or close the response if a response is not received', () => {
        const client = requestClientFixture()
        const msg = new TestSimpleRequest('hi', true)
        const response$ = msg.execute(client)
        const expected = '--------'

        expect(response$).to.equal(expected)
      })

    })

    describe('with hasResponse === false', () => {

      it('emits undefined and completes immediately after sending', () => {
        const client = requestClientFixture()
        const msg = new TestSimpleRequest('hi', false)
        const response$ = msg.execute(client)
        const expected = '(a|)'
        const values = {
          a: undefined as any,
        }

        expect(response$).with.marbleValues(values).to.equal(expected)
      })

    })

    it('emits undefined and completes after the timeout if hasResponse is set to a number, and no response is received from the client', () => {
      const client = requestClientFixture()
      const msg = new TestSimpleRequest('hi', 5)
      const response$ = msg.execute(client)
      const expected = '-----(a|)'
      const values = {
        a: undefined as any,
      }

      expect(response$).with.marbleValues(values).to.equal(expected)
    })

    it('emits a response and completes if a response is received from the client before the timeout', () => {
      const values = {
        a: 'sup',
      }
      const response$ = cold('----(a|)')
      const expected =       '----(a|)'
      const msg = new TestSimpleRequest('hi', 5)
      const client = requestClientFixture(response$, values)
      const result$ = msg.execute(client)

      expect(result$).with.marbleValues(values).to.equal(expected)
    })

  })

})
