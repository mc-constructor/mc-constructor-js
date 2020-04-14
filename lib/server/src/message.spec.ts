import { stub } from '@dandi/core/testing'
import { clientFixture, TestCompiledMessage, TestMessage } from '../../../test'
import { Client, ClientMessageResponse, ClientMessageSuccessResponse } from './client'
import { CompiledSimpleMessage, MessageType, SimpleMessage } from './message'
import { expect } from 'chai'

describe('SimpleMessage', () => {


  describe('execute', () => {

    // it('can wrap a promise', async () => {
    //   let resolve;
    //   const promise = new Promise(r => resolve = r)
    //   const test = Object.assign(promise, {
    //     foo: 'bar',
    //   })
    //   const resolved = stub()
    //   setTimeout(() => resolve, 10)
    //
    //   const getResult = async () => await test
    //   getResult().then(resolved)
    //
    //   await test
    //   expect()
    // })

    it('works', async () => {

      const msg = new TestMessage()
      const client = clientFixture()
      const sent = stub()
      const responded = stub()

      const compiled = msg.compileMessage(client)
      compiled.sent.then(sent)
      expect(sent).not.to.have.been.called

      const pending = compiled.execute()
      pending.then(responded)
      expect(responded).not.to.have.been.called

      setTimeout(() => client.lastSent().respond(['true', 'foo']), 10)

      await pending

      expect(responded).to.have.been.calledWithExactly('foo')

    })

  })

})
