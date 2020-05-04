import { expect } from 'chai'

describe.marbles('chai-marbles', ({ cold }) => {

  it('can test observables', () => {
    expect(cold('a-b-c-d-e-f')).to.equal('a-b-c-d-e-f')
  })

  xit('shows the right stack trace', () => {
    expect(cold('a-b-c-d')).equal('a-bcd')
  })

})
