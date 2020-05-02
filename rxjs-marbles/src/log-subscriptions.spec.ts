import { expect } from 'chai'

import { logSubscriptions } from './log-subscriptions'

describe.marbles('logSubscriptions', ({ cold, helpers }) => {

  it('does not break the normal operation of the observable', () => {
    const expected = 'a--b--c'
    const test$ = cold(expected)

    expect(test$).to.equal(expected)
    expect(test$.pipe(logSubscriptions(helpers.scheduler))).to.equal(expected)
  })

  it('correctly logs and compares single subscriptions', () => {
    const expected = 'a--b--c'
    const test$ = cold(expected).pipe(logSubscriptions(helpers.scheduler))

    expect(test$).to.equal(expected)
    expect(test$).to.have.been.subscribedWith('^')
  })

  it('correctly logs and compares multiple subscriptions', () => {
    const expected = 'a--b--c'
    const test$ = cold(expected).pipe(logSubscriptions(helpers.scheduler))

    expect(test$).to.equal(expected)
    expect(test$).with.subscription('--^').to.equal('--a--b--c')
    expect(test$).to.have.been.subscribedWith('^', '--^')
  })

  it('correctly logs subscription and unsubscription times', () => {
    const expected =   'a--b'
    const sub =        '^---!'
    const test$ = cold('a--b--c').pipe(logSubscriptions(helpers.scheduler))

    expect(test$).with.subscription(sub).to.equal(expected)
    expect(test$).to.have.been.subscribedWith('^---!')
  })

  it('correctly logs subscription and unsubscription times with completed sources', () => {
    const expected =    'a--b--c|'
    const expectedSub = '^------!'
    const test$ = cold(expected).pipe(logSubscriptions(helpers.scheduler))

    expect(test$).to.equal(expected)
    expect(test$).to.have.been.subscribedWith(expectedSub)
  })

})
