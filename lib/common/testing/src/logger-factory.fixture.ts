import { NoopLogger } from '@dandi/core'
import { SinonStub, stub } from 'sinon'
import { loggerFactory } from '../..'

export function stubLoggerFactory(): void {
  let getLogger: SinonStub

  beforeEach(() => {
    getLogger = stub(loggerFactory, 'getLogger').callsFake(() => new NoopLogger())
  })
  afterEach(() => {
    getLogger.restore()
    getLogger = undefined
  })
}
