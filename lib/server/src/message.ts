import { Uuid } from '@dandi/common'
import { defer, Observable } from 'rxjs'
import { map, share, single, switchMap, takeWhile, tap, timeout } from 'rxjs/operators'

import { Client, ClientMessageFailedResponse, ClientMessageResponse, ClientMessageSuccessResponse } from './client'
import { MessageError } from './message-error'

export enum MessageType {
  cmd = 'cmd',
  createStructure = 'createStructure',
  minigame = 'minigame',
}

export interface PendingMessage<TResponse = any> extends Observable<TResponse> {
  id: string | Uuid
  sent$: Observable<CompiledMessage<TResponse>>
}

export type ExecuteResponse<TResponse> = Observable<Observable<TResponse>>

export type ExecuteFn<TResponse> = () => ExecuteResponse<TResponse>

export abstract class Message<TResponse extends any = any> {
  public abstract readonly debug: string

  public execute(client: Client): PendingMessage<TResponse> {
    return this.compileMessage(client).pendingMessage$
  }
  public abstract compileMessage(client: Client): CompiledMessage<TResponse>
}

export interface CompiledMessage<TResponse = any> {
  id: string | Uuid
  pendingMessage$: PendingMessage<TResponse>
  sent$: Observable<this>
  debug: string
}

export class CompiledSimpleMessage<TResponse = any> implements CompiledMessage<TResponse> {

  public readonly id: string | Uuid
  public readonly pendingMessage$: PendingMessage<TResponse>
  public readonly sent$: Observable<this>

  constructor(
    protected readonly executeFn: ExecuteFn<TResponse>,
    protected readonly hasResponse: boolean | number,
    public readonly debug: string,
    id?: string | Uuid,
  ) {
    this.id = id || Uuid.create()

    const sent$ = defer(() => this.executeFn()).pipe(
      share(),
    )

    this.sent$ = sent$.pipe(map(() => this))

    const pendingMessage$ = sent$.pipe(
      takeWhile(() => this.hasResponse !== false),
      switchMap(response$ => response$),
      typeof this.hasResponse === 'number' ? timeout<TResponse>(this.hasResponse) : tap<TResponse>(),
      share(),
    )

    this.pendingMessage$ = Object.assign(pendingMessage$, {
      id: this.id,
      sent$: this.sent$,
    })
  }
}

export abstract class SimpleMessage<TResponse extends any = any> extends Message<TResponse> {

  public abstract readonly type: MessageType

  protected readonly hasResponse: boolean | number = true
  protected readonly allowedErrorKeys: string[] = []

  public compileMessage(client: Client): CompiledMessage<TResponse> {
    return new CompiledSimpleMessage(
      this.executeInternal.bind(this, client),
      this.hasResponse,
      this.debug,
      (this as any).id?.toString(),
    )
  }

  protected executeInternal(client: Client): ExecuteResponse<TResponse> {
    const body = this.getMessageBody()
    return client.send(this.type, body, this.hasResponse).sent$.pipe(
      map(msg => msg.pendingMessage$.pipe(map((response: ClientMessageResponse) => {
        if (!response) {
          // does not require a response, or allows a timed out response
          return undefined
        }
        if (response.success === true) {
          return this.parseSuccessResponse(response)
        }
        const err = this.parseFailedResponse(response, body)
        if (this.allowedErrorKeys.includes(err.type)) {
          return undefined
        }
        throw err
      })) as Observable<TResponse>),
      single(),
    )
  }

  protected abstract getMessageBody(): string | Uint8Array

  protected parseSuccessResponse(response: ClientMessageSuccessResponse): TResponse {
    return undefined
  }

  protected parseFailedResponse(response: ClientMessageFailedResponse, body: string | Uint8Array): MessageError {
    const [key, message] = response.extras
    return new MessageError(key, message, body)
  }

}

export abstract class SimpleArgsMessage<TArgs extends Array<any> = any[], TResponse extends any = any> extends SimpleMessage<TResponse> {
  protected readonly args: TArgs

  public get debug(): string {
    return this.getMessageBody().toString()
  }

  protected constructor(...args: TArgs) {
    super()
    this.args = args
  }

  protected formatArgs(): string {
    return this.args.join(' ')
  }

  protected getMessageBody(): string | Uint8Array {
    return this.formatArgs()
  }
}
