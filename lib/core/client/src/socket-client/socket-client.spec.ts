import { Uuid } from '@dandi/common'
import { testHarness, stub } from '@dandi/core/testing'
import { expect } from 'chai'
import { Observable } from 'rxjs'
import { TextEncoder } from 'util'

import {
  SocketConnectionFixture,
  SocketConnectionFixtureFactory,
  socketConnectionFixtureFactory,
  SocketConnectionFixtureScript
} from '../../testing'
import { RequestType } from '../request'

import { SocketClient } from './socket-client'
import { SocketClientConfig } from './socket-client-config'
import { SocketConnection } from './socket-connection'

describe.marbles('SocketClient', ({ cold }) => {

  const harness = testHarness(SocketClient,
    {
      provide: SocketConnection,
      useFactory: () => conn$,
    },
    {
      provide: SocketClientConfig,
      useFactory: () => config,
    },
  )

  let connFixture: SocketConnectionFixtureFactory
  let connFixtureScript: SocketConnectionFixtureScript
  let conn$: Observable<SocketConnectionFixture>
  let client: SocketClient
  let config: SocketClientConfig

  beforeEach(async () => {
    connFixture = socketConnectionFixtureFactory(() => connFixtureScript)
    conn$ = connFixture.conn$
    const encoder = new TextEncoder()
    config = {
      message: {
        delimiter: '*****',
        delimiterBuffer: encoder.encode('*****'),
        encoder,
      },
      socket: {} as any,
    }
    client = await harness.inject(SocketClient)
  })
  afterEach(() => {
    connFixture = undefined
    conn$ = undefined
    client = undefined
  })

  it('writes the delimiter as soon as the connection is available', () => {
    const conn$ =    cold('-----a')
    const expectedWrite = '-----a'

    connFixtureScript = { conn$ }

    const writeValues = {
      a: config.message.delimiter + '\n',
    }

    expect(client.messages$).to.equal('-')
    expect(connFixture.write$).with.marbleValues(writeValues).to.equal(expectedWrite)
  })

  it('can receive incoming messages after the delimiter is confirmed', () => {
    const conn$ =    cold('-----a--')
    const data$ =    cold('-----a-b')
    const expectedWrite = '-----a--'

    const writeValues = {
      a: config.message.delimiter + '\n',
    }

    const dataValues = {
      a: config.message.delimiter,
      b: '12345\nhi' + config.message.delimiter
    }

    const messageValues = {
      b: [Uuid.for('12345'), ['hi']]
    }

    connFixtureScript = { conn$, data$, dataValues }

    expect(connFixture.write$).with.marbleValues(writeValues).to.equal(expectedWrite)
    expect(client.messages$).with.marbleValues(messageValues).to.equal('-------b')

  })

  it('does not attempt to write any message content before the delimiter is confirmed', () => {
    const conn$ =    cold('-----a--')
    const data$ =    cold('-----a-')
    const expectedWrite = '-----(am)-'
    const expectedSend  = '-----m'

    stub(Uuid, 'create').returns('abcdef')

    const writeValues = {
      a: config.message.delimiter + '\n',
      m: `${Uuid.create()}\ncmd\nhi${config.message.delimiter}`
    }

    const dataValues = {
      a: config.message.delimiter,
    }

    const send$ = client.send(RequestType.cmd, 'hi', true)
    const msg = (client as any).pending.get('abcdef')

    const sentValues = {
      m: msg,
    }

    connFixtureScript = { conn$, data$, dataValues }

    expect(connFixture.write$, 'write$').with.marbleValues(writeValues).to.equal(expectedWrite)
    expect(client.messages$, 'messages$').to.equal('-')
    expect(send$.sent$, 'send$').with.marbleValues(sentValues).to.equal(expectedSend)
  })

})
