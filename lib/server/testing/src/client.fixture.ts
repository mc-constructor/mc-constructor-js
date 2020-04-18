import { stub } from '@dandi/core/testing'
import { SinonStub } from 'sinon'

import { Client } from '../..'
import { TestCompiledMessage } from './test-compiled-message'

export interface ClientFixture extends Client {
  lastSent(): TestCompiledMessage
  send: SinonStub
}

export function clientFixture(): ClientFixture {
  let clientCompiled: TestCompiledMessage
  return {
    messages$: undefined,
    send: stub().callsFake((type, cmd, hasResponse) => {
      clientCompiled = new TestCompiledMessage(hasResponse)
      return clientCompiled.pendingMessage
    }),
    lastSent() { return clientCompiled },
  }
}
