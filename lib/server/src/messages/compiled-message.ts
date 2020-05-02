import { Uuid } from '@dandi/common'
import { Observable } from 'rxjs'

export interface PendingMessage<TResponse = any> extends Observable<TResponse> {
  id: string | Uuid
  sent$: Observable<CompiledMessage<TResponse>>
}

export interface CompiledMessage<TResponse = any> {
  id: string | Uuid
  pendingMessage$: PendingMessage<TResponse>
  sent$: Observable<this>
  debug: string
}
