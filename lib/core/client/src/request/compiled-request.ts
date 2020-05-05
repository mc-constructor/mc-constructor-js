import { Uuid } from '@dandi/common'
import { Observable } from 'rxjs'

export interface PendingRequest<TResponse = any> extends Observable<TResponse> {
  id: string | Uuid
  sent$: Observable<CompiledRequest<TResponse>>
}

export interface CompiledRequest<TResponse = any> {
  id: string | Uuid
  pendingResponse$: PendingRequest<TResponse>
  sent$: Observable<this>
  debug: string
}
