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

  it('emits values queued before subscription', () => {
    const test$ = testStream()
    source$.next('a')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been.calledOnceWithExactly('a')
  })

  it('emits multiple values queued before subscription', () => {
    const test$ = testStream()
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

  it('does not emit values dequeued before subscription', () => {
    const test$ = testStream()
    source$.next('a')
    source$.next('b')
    dequeue$.next('a')

    test$.subscribe(testObserver)

    expect(onNext).to.have.been.calledOnceWithExactly('b')
  })

  it('completes when the source observable completes', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)

    source$.complete()

    expect(onComplete).to.have.been.calledOnce
  })

  it('errors when the source observable errors', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)

    source$.error('oh noooo')

    expect(onComplete).not.to.have.been.called
    expect(onError).to.have.been.calledOnceWithExactly('oh noooo')
  })

  it('completes when the dequeue observable completes', () => {
    const test$ = testStream()
    test$.subscribe(testObserver)

    source$.complete()

    expect(onComplete).to.have.been.calledOnce
  })

})
