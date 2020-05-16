import { summon } from '@ts-mc/core/cmd'
import { Creeper, loc, Mob } from '@ts-mc/core/types'

import { expect } from 'chai'
import { text } from '@ts-mc/core/cmd/src/text'

describe.only('summon', () => {

  it('renders a simple summon command', () => {
    expect(summon(Mob.creeper, loc(0, 0, 0)).toString()).to.equal('summon minecraft:creeper 0 0 0')
  })

  it('renders a summon charged creeper command', () => {
    expect(summon(Mob.creeper, loc(0, 0, 0), { powered: Creeper.powered }).toString())
      .to.equal('summon minecraft:creeper 0 0 0 {powered:1}')
  })

  it('renders a summon creeper command with NBT data', () => {
    expect(summon(Mob.creeper, loc(0, 0, 0), { CustomName: text('Boring Creeper') }).toString())
      .to.equal('summon minecraft:creeper 0 0 0 {CustomName:"Boring Creeper"}')
  })

})
