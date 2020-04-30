import { NoopLogger } from '@dandi/core'
import { expect } from 'chai'
import { combineLatest, forkJoin, interval, merge, Observable, of, race, ReplaySubject, Subject, timer } from 'rxjs'
import {
  bufferTime,
  catchError, concatAll, concatMap, count,
  delay, filter, finalize,
  map, mapTo, mergeAll,
  mergeMap, repeatWhen,
  share,
  startWith,
  switchMap,
  switchMapTo, takeUntil, takeWhile,
  tap,
  timeout
} from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import { SinonStub, stub } from 'sinon'

import { loggerFactory } from '../../common'
import { DequeueReplaySubject } from '../../common/rxjs'
import { dequeueReplay } from '../../common/rxjs/src/dequeue-replay'
import { stubLoggerFactory } from '../../common/testing'

import { Client, ClientMessageSuccessResponse, CompiledMessage } from '../../server'
import { clientFixture } from '../../server/testing'

import { SimpleArgsCommand } from './command'
import { parallel, series } from './multi-command'

describe.marbles.only('MultiCommand', (helpers) => {

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

  // class TestCommandFixture {
  //   private static instanceId = 0
  //
  //   public readonly sent: SinonStub = stub()
  //   public readonly responded: SinonStub = stub()
  //   public compiled: TestCompiledMessage
  //   public readonly cmd: TestCommand = new TestCommand(TestCommandFixture.instanceId++)
  //
  //   constructor() {
  //     this.compiled = cmd.compiled
  //     this.compiled.sent.then(this.sent)
  //
  //       compiled.pendingMessage.then(this.responded)
  //     })
  //   }
  //
  //   public respond(response: any): void {
  //     this.compiled.respond(response)
  //   }
  // }

  class TestCommand extends SimpleArgsCommand {
    protected readonly command = 'test'


    constructor(public readonly id: number) {
      super()
    }

    public compileMessage(client: Client): CompiledMessage {
      const compiled = super.compileMessage(client)
      return Object.assign(compiled, {
        respond(response: any) {
          (compiled as any).onResponse(response)
        }
      })
    }

    protected parseSuccessResponse(response: ClientMessageSuccessResponse): any {
      return this.id
    }
  }

  it('waits for commands to succeed before sending subsequent commands in series mode', () => {

    const client = clientFixture()

    const cmd1 = new TestCommandFixture();
    const cmd2 = new TestCommandFixture();
    const cmd3 = new TestCommandFixture();

    const cmds = series(cmd1.cmd, cmd2.cmd, cmd3.cmd)

    const pending = cmds.execute(client)
    await pending.sent

    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd1.sent).to.have.been.called
    expect(cmd2.sent).not.to.have.been.called
    expect(cmd3.sent).not.to.have.been.called

    cmd1.respond('test response 1')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd1.responded).to.have.been.called
    expect(cmd2.sent).to.have.been.called
    expect(cmd3.sent).not.to.have.been.called

    cmd2.respond('test response 2')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd2.responded).to.have.been.called
    expect(cmd3.sent).to.have.been.called

    cmd3.respond('test response 3')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd3.responded).to.have.been.called

    await pending

  })
  //
  //
  // it('does not wait for commands to succeed before sending subsequent commands in parallel mode', async () => {
  //
  //   const client = clientFixture()
  //
  //   const cmd1 = new TestCommandFixture();
  //   const cmd2 = new TestCommandFixture();
  //   const cmd3 = new TestCommandFixture();
  //
  //   const cmds = parallel(cmd1.cmd, cmd2.cmd, cmd3.cmd)
  //
  //   const responded = stub()
  //   const pending = cmds.execute(client)
  //   await pending.sent
  //   pending.then(responded)
  //
  //   await new Promise(resolve => setTimeout(resolve, 5))
  //   expect(cmd1.sent).to.have.been.called
  //   expect(cmd2.sent).to.have.been.called
  //   expect(cmd3.sent).to.have.been.called
  //
  //   cmd1.respond('test response 1')
  //   await new Promise(resolve => setTimeout(resolve, 5))
  //   expect(cmd1.responded).to.have.been.called
  //   expect(responded).not.to.have.been.called
  //
  //   cmd2.respond('test response 2')
  //   await new Promise(resolve => setTimeout(resolve, 5))
  //   expect(cmd2.responded).to.have.been.called
  //
  //   cmd3.respond('test response 3')
  //   await new Promise(resolve => setTimeout(resolve, 5))
  //   expect(cmd3.responded).to.have.been.called
  //
  //   expect(responded).to.have.been.called
  //
  //   await pending
  //
  // })

})
