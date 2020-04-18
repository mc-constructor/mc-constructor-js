import { NoopLogger } from '@dandi/core'
import { expect } from 'chai'
import { SinonStub, stub } from 'sinon'

import { loggerFactory } from '../../common'
import { stubLoggerFactory } from '../../common/testing'

import { Client, ClientMessageSuccessResponse, CompiledMessage } from '../../server'
import { clientFixture } from '../../server/testing'

import { SimpleArgsCommand } from './command'
import { parallel, series } from './multi-command'

describe('MultiCommand', () => {

  stubLoggerFactory()

  type TestCompiledMessage = CompiledMessage & { respond: (response: any) => void }

  class TestCommandFixture {
    private static instanceId = 0

    public readonly sent: SinonStub = stub()
    public readonly responded: SinonStub = stub()
    public compiled: TestCompiledMessage
    public readonly cmd: TestCommand = new TestCommand(TestCommandFixture.instanceId++)

    constructor() {
      this.cmd.compiled.then(compiled => {
        this.compiled = compiled
        compiled.sent.then(this.sent)
        compiled.pendingMessage.then(this.responded)
      })
    }

    public respond(response: any): void {
      this.compiled.respond(response)
    }
  }


  class TestCommand extends SimpleArgsCommand {
    protected readonly command = 'test'

    public readonly compiled: Promise<TestCompiledMessage>

    private onCompiled: (compiled: TestCompiledMessage) => void

    constructor(public readonly id: number) {
      super()
      this.compiled = new Promise<TestCompiledMessage>(resolve => this.onCompiled = resolve)
    }

    public compileMessage(client: Client): CompiledMessage {
      const compiled = super.compileMessage(client)
      this.onCompiled(Object.assign(compiled, {
        respond(response: any) {
          (compiled as any).onResponse(response)
        }
      }))
      return compiled
    }

    protected parseSuccessResponse(response: ClientMessageSuccessResponse): any {
      return this.id
    }
  }

  it('waits for commands to succeed before sending subsequent commands in series mode', async () => {

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


  it('does not wait for commands to succeed before sending subsequent commands in parallel mode', async () => {

    const client = clientFixture()

    const cmd1 = new TestCommandFixture();
    const cmd2 = new TestCommandFixture();
    const cmd3 = new TestCommandFixture();

    const cmds = parallel(cmd1.cmd, cmd2.cmd, cmd3.cmd)

    const responded = stub()
    const pending = cmds.execute(client)
    await pending.sent
    pending.then(responded)

    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd1.sent).to.have.been.called
    expect(cmd2.sent).to.have.been.called
    expect(cmd3.sent).to.have.been.called

    cmd1.respond('test response 1')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd1.responded).to.have.been.called
    expect(responded).not.to.have.been.called

    cmd2.respond('test response 2')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd2.responded).to.have.been.called

    cmd3.respond('test response 3')
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(cmd3.responded).to.have.been.called

    expect(responded).to.have.been.called

    await pending

  })

})
