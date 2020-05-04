import { expect } from 'chai'
import {
  interval,
  merge,
  Observable,
  of,
} from 'rxjs'
import {
  bufferTime,
  concatAll,
  delay,
  finalize,
  map,
  mergeAll,
  mergeMap,
  share,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'

import { dequeueReplay } from '../../common/rxjs'
import { stubLoggerFactory } from '../../common/testing'
import { clientFixture, TestCommand } from '../../client/testing'

import { parallel, series } from './multi-command'

describe.marbles('MultiCommand', (helpers) => {

  const { cold } = helpers

  stubLoggerFactory()

  describe('proof of concept for multi message processing with long running message warnings', () => {

    function createStreams(scheduler: TestScheduler, parallel: boolean, muteLog: boolean = true) {
      const execMessages = [
        cold('a|'),
        cold('--b|'),
        cold('---- 300ms ----c|'),
        cold('---- 150ms -d|'),
      ]
      const log = (...args: any[]) => muteLog ? undefined : console.log(...args)

      const source$ = of(execMessages.map(msg => msg)).pipe(
        share(),
      )

      const complete$: Observable<any> = source$.pipe(
        switchMap(messages => {

          const execState = { remaining: execMessages.length }
          const messageStates: Observable<[Observable<string>, string]>[] = messages.map(msg => msg.pipe(
            map(result => [msg, result] as [Observable<string>, string])
          ))

          // actual processing of messages
          const msgs$ = of(...messageStates).pipe(
            parallel ? mergeAll() : concatAll(),
            tap(msgState => {
              execState.remaining--
              log(scheduler.frame, msgState[1], 'remaining', execState.remaining)
            }),
          ).pipe(
            finalize(() => log(scheduler.frame, 'msgs$ done')),
            share(),
          )

          // If there is more than 100ms between message completions, start emitting warnings every 100ms until the
          // next message result is emitted. In the real implementation, emissions from this stream will be filtered
          // out, but they are left in here for marble testing
          const debug$: Observable<any> = msgs$.pipe(
            tap(v => log(scheduler.frame, 'debug$', v[1])),
            takeWhile(() => execState.remaining > 0), // IMPORTANT so it stops when there are no more pending messages
            switchMap(() =>
              interval(100).pipe(
                takeUntil(msgs$.pipe(
                  tap(v => log(scheduler.frame, 'interval stopper', v[1])),
                )),
                tap(() => log(scheduler.frame, 'warn remaining', execState.remaining)),
                map(() => [undefined, 'W']),
              )
            ),
            finalize(() => log(scheduler.frame, 'debug$ done')),
          )
          return merge(msgs$, debug$)
        }),
        finalize(() => log(scheduler.frame, 'complete$ done')),
        share(),
      )

      const remaining$ = source$.pipe(
        mergeMap(messages => messages),
        dequeueReplay(complete$, (trigger, event) => trigger[0] === event),
      )

      const remainingCounter$ = complete$.pipe(
        delay(1), // needs to be delayed by 1 to let the dequeue take effect
        switchMap(() => remaining$.pipe(
          bufferTime(0),
          map(remaining => remaining.length.toString()),
        ))
      )

      const output$ = complete$.pipe(
        map(([, result]) => result),
      )

      return { output$, remainingCounter$ }
    }

    it('works for parallelized tasks', () => {
      const { scheduler } = helpers
      const { output$, remainingCounter$ } = createStreams(scheduler, true)

      const expected =          'a-b  99ms W 50ms --d 99ms W 50ms --c|'
      // note: duplicate 3s and 2s due to debug/warning emissions
      const expectedRemaining = '-4-3 99ms 3 50ms --2 99ms 2 50ms --1|'

      const sub = '^-'

      expect(output$).with.subscription(sub).to.equal(expected)
      expect(remainingCounter$).with.subscription(sub).to.equal(expectedRemaining)
    })

    it('works for serialized tasks', () => {
      const { scheduler } = helpers
      const { output$, remainingCounter$ } = createStreams(scheduler, false)

      const expected =          'a--b  99ms W 99ms W 99ms W --------c 99ms W 50ms -----d|'
      // note: duplicate 3s and 2s due to debug/warning emissions
      const expectedRemaining = '-4--3 99ms 3 99ms 3 99ms 3 --------2 99ms 2 50ms -----1|'
      const sub = '^-'

      expect(output$).with.subscription(sub).to.equal(expected)
      expect(remainingCounter$).with.subscription(sub).to.equal(expectedRemaining)
    })
  })

  it('waits for commands to succeed before sending subsequent commands in series mode', () => {

    const cmds = {
      a: new TestCommand(true, 'a'),
      b: new TestCommand(true, 'b'),
      c: new TestCommand(true, 'c'),
    }
    const client = clientFixture([
      cold('---a|'),
      cold('---b|'),
      cold('---c|'),
    ])
    const values = {
      r: ['a', 'b', 'c']
    }
    // TODO: is there a way to check the timing of individual commands
    const expected = '-----------(r|)'
    const cmd$ = series(cmds.a, cmds.b, cmds.c).execute(client)
    expect(cmd$).with.marbleValues(values).to.equal(expected)

  })

  it('does not wait for commands to succeed before sending subsequent commands in parallel mode', () => {
    const cmds = {
      a: new TestCommand(true, 'a'),
      b: new TestCommand(true, 'b'),
      c: new TestCommand(true, 'c'),
    }
    const client = clientFixture([
      cold('---a|'),
      cold('---b|'),
      cold('---c|'),
    ])
    const values = {
      r: ['a', 'b', 'c']
    }
    const expected = '---(r|)'
    const cmd$ = parallel(cmds.a, cmds.b, cmds.c).execute(client)

    expect(cmd$).with.marbleValues(values).to.equal(expected)
  })

})
