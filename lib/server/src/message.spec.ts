// import { stub } from '@dandi/core/testing'
// import { expect } from 'chai'
//
// import { clientFixture, TestMessage } from '../testing'
//
// import { SimpleMessage } from './message'
//
// describe('SimpleMessage', () => {
//
//
//   describe('execute', () => {
//
//     it('works', async () => {
//
//       const msg = new TestMessage()
//       const client = clientFixture()
//       const sent = stub()
//       const responded = stub()
//
//       const compiled = msg.compileMessage(client)
//       compiled.sent.then(sent)
//       expect(sent).not.to.have.been.called
//
//       const pending = compiled.execute()
//       pending.then(responded)
//       expect(responded).not.to.have.been.called
//
//       setTimeout(() => client.lastSent().respond(['true', 'foo']), 10)
//
//       await pending
//
//       expect(responded).to.have.been.calledWithExactly('foo')
//
//     })
//
//   })
//
// })
