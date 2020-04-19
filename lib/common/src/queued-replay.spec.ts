import { Observable, Observer, Subject } from 'rxjs'
import { expect } from 'chai'
import { SinonSpy, spy } from 'sinon'

import { queuedReplay } from './queued-replay'

describe('queuedReplay', () => {

  let source$: Subject<string>
  let dequeue$: Subject<string>
  let onNext: SinonSpy
  let onError: SinonSpy
  let onComplete: SinonSpy
  let testObserver: Observer<string>

  beforeEach(() => {
    source$ = new Subject<string>()
    dequeue$ = new Subject<string>()
    onNext = spy()
    onError = spy()
    onComplete = spy()
    testObserver = {
      next: onNext,
      error: onError,
      complete: onComplete,
    }
  })
  afterEach(() => {
    source$.complete()
    dequeue$.complete()
    source$ = undefined
    dequeue$ = undefined
    onNext = undefined
    onError = undefined
    onComplete = undefined
    testObserver = undefined
  })

  function testStream(): Observable<string> {
    return source$.pipe(
      queuedReplay(dequeue$),
    )
  }

  it('emits values queued before second subscription', () => {
    const test$ = testStream()
    test$.subscribe()

    source$.next('a')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been.calledOnceWithExactly('a')
  })

  it('emits multiple values queued before second subscription', () => {
    const test$ = testStream()
    test$.subscribe()

    source$.next('a')
    source$.next('b')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been
      .calledTwice
      .calledWithExactly('a')
      .calledWithExactly('b')
  })

  it('emits values after subscription', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)

    expect(onNext).not.to.have.been.called

    source$.next('a')
    expect(onNext).to.have.been.calledOnceWithExactly('a')
  })

  it('does not emit values dequeued before second subscription', () => {
    const test$ = testStream()
    test$.subscribe()
    source$.next('a')
    source$.next('b')
    dequeue$.next('a')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been.calledOnceWithExactly('b')
  })

  it('errors when the source observable errors', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)

    source$.error('oh noooo')

    expect(onComplete).not.to.have.been.called
    expect(onError).to.have.been.calledOnceWithExactly('oh noooo')
  })

  it('errors when the dequeue observable errors', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)

    dequeue$.error('oh noooo')

    expect(onComplete).not.to.have.been.called
    expect(onError).to.have.been.calledOnceWithExactly('oh noooo')
  })

  it('completes when there is a buffered value and both the source and dequeue observables complete', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)
    source$.next('a')

    source$.complete()
    dequeue$.complete()

    expect(onComplete).to.have.been.calledOnce
  })

  it('completes when the source observable completes', () => {
    const test$ = testStream()
    test$.subscribe()
    source$.next('a')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been.calledOnceWithExactly('a')
    expect(onComplete).not.to.have.been.called

    source$.complete()

    expect(onComplete).to.have.been.calledOnce
  })

  it('remains subscribed to the dequeue trigger if the source completes, but there are buffered values', () => {
    const test$ = testStream()
    const sub = test$.subscribe()
    source$.next('a')

    sub.unsubscribe()
    expect(dequeue$.observers.length).to.equal(1)

    source$.complete()
    expect(dequeue$.observers.length).to.equal(1)
  })

  it('unsubscribes from the dequeue trigger when the source observable completes and all remaining buffered values are dequeued', () => {
    const test$ = testStream()
    test$.subscribe()
    source$.next('a')

    test$.subscribe(testObserver)

    source$.complete()
    expect(dequeue$.observers.length).to.equal(1)

    dequeue$.next('a')
    expect(dequeue$.observers.length).to.equal(0)
  })

  it('emits queued values after resubscription when initial subscribers have unsubscribed', () => {
    const test$ = testStream()
    const initSub = test$.subscribe()

    source$.next('a')
    source$.next('b')

    initSub.unsubscribe()

    test$.subscribe(testObserver)

    expect(onNext).to.have.been
      .calledTwice
      .calledWithExactly('a')
      .calledWithExactly('b')
  })

  it('dequeues values when initial subscribers have unsubscribed', () => {
    const test$ = testStream()
    const initSub = test$.subscribe()

    source$.next('a')
    source$.next('b')

    initSub.unsubscribe()

    dequeue$.next('a')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been.calledOnceWithExactly('b')
  })

})
