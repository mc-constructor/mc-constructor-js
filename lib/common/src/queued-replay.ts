import { Observable, Observer, OperatorFunction } from 'rxjs'

export function queuedReplay<T>(dequeueTrigger: Observable<T>): OperatorFunction<T, T> {
  return (source: Observable<T>) => {
    let cleanupSubs: () => void
    const buffer: T[] = []
    const observers = new Set<Observer<T>>()

    const cleanup = (reason: string): void => {
      console.log('queuedReplay cleanup', reason)
      buffer.length = 0
      observers.clear()
      if (cleanupSubs) {
        cleanupSubs()
        cleanupSubs = undefined
      }
    }

    const observersObserver: Observer<T> = {
      next: (value: T): void => observers.forEach(o => o.next(value)),
      error: (err: any): void => {
        observers.forEach(o => o.error(err))
        cleanup('observers after error')
      },
      complete: (): void => {
        observers.forEach(o => o.complete())
        cleanup('observers after complete')
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

    return new Observable<T>(o => {
      console.log('queuedReplay onSubscribe')
      observers.add(o)
      buffer.forEach(value => o.next(value))

      if (!cleanupSubs) {
        console.log('queuedReplay inner subscribing')
        const sourceSub = source.subscribe(sourceObserver)
        const dequeueSub = dequeueTrigger.subscribe(dequeueObserver)
        cleanupSubs = (): void => {
          sourceSub.unsubscribe()
          dequeueSub.unsubscribe()
        }
      }
      return () => {
        console.log('queuedReplay subscriber done')
        observers.delete(o)
        if (!observers.size) {
          cleanup('no more observers')
        }
      }
    })
  }
}
