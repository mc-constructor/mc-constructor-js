import { expect } from 'chai'

import { objectiveDisplayArgs, ObjectiveDisplaySlot } from './objectives'

describe('objectiveDisplayArgs', () => {
  it('converts a slot and id', () => {
    expect(objectiveDisplayArgs(ObjectiveDisplaySlot.sidebar, 'test')).to.deep.equal({
      slot: ObjectiveDisplaySlot.sidebar,
      id: 'test',
    })
  })
})
