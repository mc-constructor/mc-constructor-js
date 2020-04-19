import { Observable, Observer, OperatorFunction } from 'rxjs'

export function queuedReplay<T>(dequeueTrigger: Observable<T>): OperatorFunction<T, T> {
  return (source: Observable<T>) => {
    let cleanupSubs: () => void
    const buffer: T[] = []
    const observers = new Set<Observer<T>>()
    let sourceComplete: boolean = false
    let dequeueComplete: boolean = false
    let complete: boolean = false

    const cleanup = (): void => {
      buffer.length = 0
      observers.clear()
      if (cleanupSubs) {
        cleanupSubs()
        cleanupSubs = undefined
      }
    }

    const checkCompleteness = (): boolean => {
      if (sourceComplete && dequeueComplete) {
        observersObserver.complete()
        cleanup()
        complete = true
      }
      return complete
    }

    const observersObserver: Observer<T> = {
      next: (value: T): void => observers.forEach(o => o.next(value)),
      error: (err: any): void => {
        observers.forEach(o => o.error(err))
        cleanup()
      },
      complete: (): void => {
        observers.forEach(o => o.complete())
        observers.clear()
      },
    }

    const sourceObserver: Observer<T> = {
      next: (value: T): void => {
        buffer.push(value)
        observersObserver.next(value)
      },
      error: observersObserver.error,
      complete: () => {
        sourceComplete = true
        observersObserver.complete()
        checkCompleteness()
      },
    }

    const dequeueObserver: Observer<T> = {
      next: (value): void => {
        const index = buffer.indexOf(value)
        if (index >= 0) {
          buffer.splice(index, 1)
        }
        if (sourceComplete && !buffer.length) {
          dequeueComplete = true
          checkCompleteness()
        }
      },
      error: observersObserver.error,
      complete: () => {
        dequeueComplete = true
        checkCompleteness()
      },
    }

    return new Observable<T>(o => {
      buffer.forEach(value => o.next(value))

      if (complete) {
        o.complete()
        return () => {}
      }

      observers.add(o)
      if (!cleanupSubs) {
        const sourceSub = source.subscribe(sourceObserver)
        const dequeueSub = dequeueTrigger.subscribe(dequeueObserver)
        cleanupSubs = (): void => {
          sourceSub.unsubscribe()
          dequeueSub.unsubscribe()
        }
      }
      return () => {
        observers.delete(o)
      }
    })
  }
}
