import { Observable, Observer, OperatorFunction } from 'rxjs'

export function queuedReplay<T>(dequeueTrigger: Observable<T>): OperatorFunction<T, T> {
  return (source: Observable<T>) => {
    const buffer: T[] = []
    const observers: Observer<T>[] = []
    const observersObserver: Observer<T> = {
      next: (value: T): void => observers.forEach(o => o.next(value)),
      error: (err: any): void => {
        observers.forEach(o => o.error(err))
        cleanup()
      },
      complete: (): void => {
        observers.forEach(o => o.complete())
        cleanup()
      },
    }
    const sourceObserver: Observer<T> = {
      next: (value: T): void => {
        buffer.push(value)
        observersObserver.next(value)
      },
      error: observersObserver.error,
      complete: observersObserver.complete,
    }
    const dequeueObserver: Observer<T> = {
      next: (value): void => {
        const index = buffer.indexOf(value)
        if (index >= 0) {
          buffer.splice(index, 1)
        }
      },
      error: observersObserver.error,
      complete: observersObserver.complete,
    }
    const sourceSub = source.subscribe(sourceObserver)
    const dequeueSub = dequeueTrigger.subscribe(dequeueObserver)
    const cleanup = (): void => {
      sourceSub.unsubscribe()
      dequeueSub.unsubscribe()
      buffer.length = 0
      observers.length = 0
    }

    return new Observable<T>(o => {
      observers.push(o)
      buffer.forEach(value => o.next(value))
      return () => {}
    })
  }
}
