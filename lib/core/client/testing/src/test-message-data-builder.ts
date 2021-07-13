import { Uuid } from '@dandi/common'
import { stub } from '@dandi/core/testing'
import { MarbleKey, MarbleValues } from '@rxjs-stuff/marbles'
import {
  ClientResponse,
  CompiledRequest,
  PendingResponse,
  RequestType,
  SocketClient,
  SocketClientConfig
} from '@ts-mc/core/client'
import { expect } from 'chai'
import { Observable, of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { SocketConnectionFixtureFactory } from './socket-connection.fixture'

export type Opaque<K, T> = T & { __TYPE__: K }
export type MarbleScript<TMarbles extends MarbleKey> = Opaque<string, 'MarbleScript'>

const MARBLE_CHARS = '-()|'.split('')

export interface MarbleScriptFactory<TMarbles extends MarbleKey> {
  (marbles: string): MarbleScript<TMarbles>
}

export function marbleScriptFactory<TMarbles extends MarbleKey>(marbles: TMarbles[]): MarbleScriptFactory<TMarbles> {
  const allAllowed = MARBLE_CHARS.concat(marbles)
  return function marbleScript(script: string): MarbleScript<TMarbles> {
    const invalidChar = script.split('').find(char => !allAllowed.includes(char))
    if (invalidChar !== undefined) {
      throw new Error(`'${invalidChar}' is not allowed - allowed characters are '${allAllowed.join(`', '`)}'`)
    }
    return script as MarbleScript<TMarbles>
  }
}

export function marbleScript<TMarbles extends MarbleKey>(marbles: TMarbles[], script: string): MarbleScript<TMarbles> {
  return marbleScriptFactory(marbles)(script)
}

export interface ExpectedData<
  TDelimiterMarble extends MarbleKey,
  TDataMarble extends MarbleKey,
  TMessageMarbles extends MarbleKey,
> {
  dataValues: MarbleValues<string, TDelimiterMarble | TDataMarble>
  writeValues: MarbleValues<string, TDelimiterMarble | TMessageMarbles>
  responseValues: MarbleValues<ClientResponse, TMessageMarbles>
}

export interface SendResult<
  TMessageMarbles extends MarbleKey,
> {
  requests: MarbleValues<CompiledRequest<ClientResponse>, TMessageMarbles>
  responses: MarbleValues<PendingResponse, TMessageMarbles>
  sent: MarbleValues<Observable<CompiledRequest<ClientResponse>>, TMessageMarbles>
}

export interface TestMessageInfo<TMarble extends MarbleKey> {
  marble: TMarble
  request: {
    type: RequestType
    content: string
  }
  hasResponse: boolean | number
  expectedResponse?: ClientResponse
}

export type MessageMarbles<TMessageMarbles extends MarbleKey> = {
  [TMarble in TMessageMarbles]: MarbleScript<TMarble>
}

export type MessageMarbleScriptFactories<TMessageMarbles extends MarbleKey> = {
  [TMarble in TMessageMarbles]: MarbleScriptFactory<TMarble>
}

export interface ExpectedMarbles<
  TDelimiterMarble extends MarbleKey,
  TMessageMarbles extends MarbleKey,
> {

  // dataValues: MarbleValues<string, TDelimiterMarble | TDataMarble>
  // writeValues: MarbleValues<string, TDelimiterMarble | TMessageMarbles>
  // responseValues: MarbleValues<ClientResponse, TMessageMarbles>

  requests: MessageMarbles<TMessageMarbles>
  responses: MessageMarbles<TMessageMarbles>
  messages: MarbleScript<TMessageMarbles>
  write: MarbleScript<TDelimiterMarble | TMessageMarbles>
}

export class TestDataBuilder<TDelimiterMarble extends MarbleKey, TDataMarble extends MarbleKey> {
  protected readonly delimiter: string

  public static forConfig<TDelimiterMarble extends MarbleKey, TDataMarble extends MarbleKey>(
    config: SocketClientConfig, delimiterMarble: MarbleKey, dataMarble: MarbleKey
  ): TestDataBuilder<TDelimiterMarble, TDataMarble>
  public static forConfig(config: SocketClientConfig): TestDataBuilder<'x', 'm'>
  public static forConfig(config: SocketClientConfig, delimiterMarble: MarbleKey = 'x', dataMarble: MarbleKey = 'm') {
    return new TestDataBuilder(config, delimiterMarble, dataMarble)
  }

  constructor(
    protected readonly config: SocketClientConfig,
    public readonly delimiterMarble: TDelimiterMarble,
    public readonly dataMarble: TDataMarble,
  ) {
    this.delimiter = config.message.delimiter
  }

  public add<TMarble extends MarbleKey>(marble: TMarble, type: RequestType, content: string, hasResponse: true | number, expectedResponse: ClientResponse): TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMarble>
  public add<TMarble extends MarbleKey>(marble: TMarble, type: RequestType, content: string, hasResponse: false): TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMarble>
  public add<TMarble extends MarbleKey>(marble: TMarble, type: RequestType, content: string, hasResponse: boolean | number, expectedResponse?: ClientResponse): TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMarble> {
    const messages = [{ marble, request: { type, content }, hasResponse, expectedResponse }]
    return new TestMessageDataBuilder(this.config, this.delimiterMarble, this.dataMarble, messages)
  }
}

export class TestMessageDataBuilder<
  TDelimiterMarble extends MarbleKey,
  TDataMarble extends MarbleKey,
  TMessageMarbles extends MarbleKey = never,
> extends TestDataBuilder<TDelimiterMarble, TDataMarble> {

  constructor(
    config: SocketClientConfig,
    delimiterMarble: TDelimiterMarble,
    dataMarble: TDataMarble,
    private readonly testMessages: TestMessageInfo<TMessageMarbles>[]
  ) {
    super(config, delimiterMarble, dataMarble)
  }

  public add<TMarble extends MarbleKey>(marble: TMarble, type: RequestType, content: string, hasResponse: true | number, expectedResponse: ClientResponse): TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMessageMarbles | TMarble>
  public add<TMarble extends MarbleKey>(marble: TMarble, type: RequestType, content: string, hasResponse: false): TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMessageMarbles | TMarble>
  public add<TMarble extends MarbleKey>(marble: TMarble, type: RequestType, content: string, hasResponse: boolean | number, expectedResponse?: ClientResponse): TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMessageMarbles | TMarble> {
    const self = this as TestMessageDataBuilder<TDelimiterMarble, TDataMarble, TMessageMarbles | TMarble>
    self.testMessages.push({ marble, request: { type, content }, hasResponse, expectedResponse })
    return self
  }

  public build(): TestData<TDelimiterMarble, TDataMarble, TMessageMarbles> {
    return new TestData(this.config, this.delimiterMarble, this.dataMarble, this.testMessages)
  }
}

class TestData<
  TDelimiterMarble extends MarbleKey,
  TDataMarble extends MarbleKey,
  TMessageMarbles extends MarbleKey = never,
  > {

  /**
   * Delimiter value, full data of scripted response
   */
  public readonly dataValues: MarbleValues<string, TDelimiterMarble | TDataMarble | TMessageMarbles> = {}
  public readonly writeValues: MarbleValues<string, TDelimiterMarble | TMessageMarbles> = {}
  public readonly responseValues: MarbleValues<ClientResponse, TMessageMarbles> = {}

  // public readonly dataMarbles: MarbleScriptFactory<TDelimiterMarble | TDataMarble>
  public readonly writeMarbles: MarbleScriptFactory<TDelimiterMarble | TDataMarble>
  public readonly messageMarbles: MarbleScriptFactory<TMessageMarbles>
  public readonly responseMarbles: MessageMarbleScriptFactories<TMessageMarbles>

  private readonly delimiter: string

  constructor(
    config: SocketClientConfig,
    private readonly delimiterMarble: TDelimiterMarble,
    private readonly dataMarble: TDataMarble,
    private readonly testMessages: TestMessageInfo<TMessageMarbles>[]
  ) {
    this.delimiter = config.message.delimiter
    this.dataValues[this.delimiterMarble] = this.delimiter
    this.writeValues[this.delimiterMarble] = `${this.delimiter}\n`
    const uuid = stub(Uuid, 'create')
    let data = ''
    this.testMessages.forEach((message, index) => {
      uuid.onCall(index).returns(message.marble)
      this.writeValues[message.marble] = `${message.marble}\n${message.request.type}\n${message.request.content}${this.delimiter}`
      if (message.hasResponse !== false) {
        this.responseValues[message.marble] = message.expectedResponse
        data += `${message.marble}\n${message.expectedResponse.success}`
        if (message.expectedResponse.extras) {
          data += `\n${message.expectedResponse.extras.join('\n')}`
        }
        data += this.delimiter
      }
    })
    this.dataValues[this.dataMarble] = data

    const messageMarbles = testMessages.map(message => message.marble)
    // this.dataMarbles = marbleScriptFactory([this.delimiterMarble, this.dataMarble])
    this.writeMarbles = marbleScriptFactory([this.delimiterMarble, ...messageMarbles])
    this.messageMarbles = marbleScriptFactory(messageMarbles)
    this.responseMarbles = messageMarbles.reduce((result, marble) => {
      result[marble] = marbleScriptFactory([marble])
      return result
    }, {} as MessageMarbleScriptFactories<TMessageMarbles>)
  }

  public sendMessages(client: SocketClient): SendResult<TMessageMarbles> {
    return this.testMessages.reduce((result, message) =>  {
      const res$ = client.send(message.request.type, message.request.content, message.hasResponse)
      result.requests[message.marble] = client.getPendingMessage(message.marble)
      result.responses[message.marble] = res$
      result.sent[message.marble] = res$.sent$
      return result
    }, {
      requests: {},
      responses: {},
      sent: {},
    } as SendResult<TMessageMarbles>)
  }

  public verify(
    client: SocketClient,
    connFixture: SocketConnectionFixtureFactory,
    expected: ExpectedMarbles<TDelimiterMarble, TMessageMarbles>,
  ): void {
    const sends = this.sendMessages(client)

    // source              | was       | is
    // --------------------|-----------|----------
    // client.send         | sendX$    | sends.responses.x
    // client.send().sent$ | n/a       | sends.sent.x
    // client.pending.get  | msgX      | sends.requests.x

    this.testMessages.forEach(message => {
      // verify each of "sends.sent" with "sent.requests" marbles
      const sent$ = sends.sent[message.marble]
      const expectedRequest$ = expected.requests[message.marble]
      expect(sent$, `sent(${message.marble})`).with.marbleValues(sends.requests).to.equal(expectedRequest$)

      // verify each of "sends.responses" with "testData.responseValues" marbles
      const response$ = sends.responses[message.marble]
      const expectedResponse$ = expected.responses[message.marble]
      expect(response$, `response(${message.marble})`).with.marbleValues(this.responseValues).to.equal(expectedResponse$)
    })

    // verify connFixture.write with "writeValues" marbles
    expect(connFixture.write$, 'write$').with.marbleValues(this.writeValues).to.equal(expected.write)

    // verify client.messages$ with "testData.responseValues" marbles?
    // FIXME: what does messages$ actually do?
    expect(client.messages$, 'client.messages$').with.marbleValues(sends.requests).to.equal(expected.messages)
  }
}
