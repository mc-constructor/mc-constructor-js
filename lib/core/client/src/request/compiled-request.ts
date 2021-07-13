import { Observable } from 'rxjs'

export interface PendingResponse<TResponse = any> extends Observable<TResponse> {
  id: string
  sent$: Observable<CompiledRequest<TResponse>>
}

export interface CompiledRequest<TResponse = any> {
  id: string
  pendingResponse$: PendingResponse<TResponse>
  sent$: Observable<this>
  debug: string
}
