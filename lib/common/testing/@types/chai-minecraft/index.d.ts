import * as chai from 'chai'

import { Area } from '../../../../types'

declare global {
  export namespace Chai {
    interface Assertion {
      within(area: Area): Include
    }
  }
}
