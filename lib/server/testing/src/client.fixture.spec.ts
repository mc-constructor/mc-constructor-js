import { expect } from 'chai'

import { MessageType } from '../../src/messages'

import { clientFixture } from './client.fixture'

describe.marbles('ClientFixture', ({ cold }) => {

  describe('send', () => {

    describe('with hasResponse === true', () => {
      
      it('does not emit or close the response if a response is not received', () => {
        const client = clientFixture()
        const msg = client.send(MessageType.cmd, 'hi', true)
        const expected = '--------'

        expect(msg).to.equal(expected)
      })

      it('emits the response when a response is received', () => {
        const values = {
          a: {
            success: true,
            extras: ['a'],
          }
        }
        const response$ = cold('------a|')
        const expected =       '------a|'
        const client = clientFixture(response$)
        const msg = client.send(MessageType.cmd, 'hi', true)

        expect(msg).with.marbleValues(values).to.equal(expected)
      })

    })

    describe('with hasResponse === false', () => {
      it('does not emit and closes the response immediately after the request is sent', () => {
        const client = clientFixture()
        const msg = client.send(MessageType.cmd, 'hi', false)
        const expected = '|'

        expect(msg).to.equal(expected)
      })
    })
    
    describe(`with type hasResponse === 'number'`, () => {

      it('does not emit and completes the response after the specified timeout', () => {
        const client = clientFixture()
        const msg = client.send(MessageType.cmd, 'hi', 5)
        const expected = '-----|'

        expect(msg).to.equal(expected)
      })

      it('emits and completes the response when a response is received before the specified timeout', () => {
        const values = {
          a: {
            success: true,
            extras: ['a'],
          }
        }
        const response$ = cold('---a|')
        const expected =       '---a|'
        const client = clientFixture(response$)
        const msg = client.send(MessageType.cmd, 'hi', true)

        expect(msg).with.marbleValues(values).to.equal(expected)
      })

    })

  })

})
