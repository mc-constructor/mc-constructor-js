import { testHarness } from '@dandi/core/testing'
import { expect } from 'chai'
import { Observable } from 'rxjs'
import { TextEncoder } from 'util'

import {
  SocketConnectionFixture,
  SocketConnectionFixtureFactory,
  socketConnectionFixtureFactory,
  SocketConnectionFixtureScript,
  TestDataBuilder,
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

  let prev: any
  let id: 0
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
    const clientId = id++
    expect(conn$).not.to.have.property('_id')
    Object.assign(conn$, {_id: clientId})
    expect(prev).not.to.eq(conn$)
    if (prev) {
      expect(prev._id).not.to.equal(clientId)
    }
    prev = conn$
  })
  afterEach(() => {
    connFixture = undefined
    conn$ = undefined
    client = undefined
    connFixtureScript = undefined
  })

  it('writes the delimiter as soon as the connection is available', () => {
    const conn$ =    cold('-----a')
    const expectedWrite = '-----a'

    const writeValues = {
      a: config.message.delimiter + '\n',
    }

    connFixtureScript = { conn$ }

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
      b: ['12345', ['hi']]
    }

    connFixtureScript = { conn$, data$, dataValues }

    expect(connFixture.write$).with.marbleValues(writeValues).to.equal(expectedWrite)
    expect(client.messages$).with.marbleValues(messageValues).to.equal('-------b')
  })

  it('does not attempt to write any message content before the delimiter is confirmed', () => {
    const conn$ =    cold('-----a--')
    const data$ =    cold('-----xm-')

    const testData = TestDataBuilder.forConfig(config)
      .add('a', RequestType.cmd, 'hi', true, { success: true, extras: ['hijklmnop'] })
      .build()

    connFixtureScript = { conn$, data$, dataValues: testData.dataValues }

    testData.verify(client, connFixture, {
      requests: {
        a: testData.responseMarbles.a('-----a'),
      },
      responses: {
        a: testData.responseMarbles.a('------(a|)'),
      },
      messages: testData.messageMarbles('-'), // FIXME: what *is* this??,
      write: testData.writeMarbles('-----(xa)-'),
    })
  })

  it('splits data chunks with multiple delimiters into separate responses', () => {
    const conn$ =    cold('-----x--')
    const data$ =    cold('-----xm-')

    const testData = new TestDataBuilder(config, 'x', 'm')
      .add('a', RequestType.cmd, 'hi', true, { success: true, extras: ['hihi'] })
      .add('b', RequestType.cmd, 'hello', true, { success: true, extras: ['hellohello']})
      .add('c', RequestType.cmd, 'greetings', true, { success: true, extras: ['greetingsgreetings']})
      .build()

    connFixtureScript = { conn$, data$, dataValues: testData.dataValues }

    testData.verify(client, connFixture, {
      requests: {
        a: testData.responseMarbles.a('-----a'),
        b: testData.responseMarbles.b('-----b'),
        c: testData.responseMarbles.c('-----c'),
      },
      responses: {
        a: testData.responseMarbles.a('------(a|)'),
        b: testData.responseMarbles.b('------(b|)'),
        c: testData.responseMarbles.c('------(c|)'),
      },
      messages: testData.messageMarbles('-'),
      write: testData.writeMarbles('-----(xabc)-'),
    })
  })

})
