import { Uuid } from '@dandi/common'
import { Observable } from 'rxjs'

export interface PendingRequest<TResponse = any> extends Observable<TResponse> {
  id: string
  sent$: Observable<CompiledRequest<TResponse>>
}

export interface CompiledRequest<TResponse = any> {
  id: string
  pendingResponse$: PendingRequest<TResponse>
  sent$: Observable<this>
  debug: string
}
