import { Uuid } from '@dandi/common'
import { Player } from '@ts-mc/core/types'

export function playerFixture(name: string = 'somebody'): Player {
  return {
    uuid: Uuid.create().toString(),
    name,
  }
}
