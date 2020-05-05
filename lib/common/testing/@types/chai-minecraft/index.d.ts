import * as chai from 'chai'

import { Area } from '@ts-mc/core/types'

declare global {
  export namespace Chai {
    interface Assertion {
      within(area: Area): Include
    }
  }
}
