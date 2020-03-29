import { ChildProcessWithoutNullStreams, spawn } from 'child_process'

import { Injectable, Provider } from '@dandi/core'

import { SharedObservable } from '../../common'

import { Client } from './client'

const SERVER_CMD_INDEX = process.argv.indexOf('--cmd')
const SERVER_CMD = process.argv[SERVER_CMD_INDEX + 1]

class PendingCommand {

  public readonly promise: Promise<string>

  private _resolve: (value: string) => void
  public get resolve(): (value: string) => void {
    return this._resolve
  }

  constructor(public readonly cmd: string, public readonly expectResponse: boolean) {
    this.promise = new Promise<string>(resolve => this._resolve = resolve)
  }
}

@Injectable()
export class Server extends SharedObservable<string> implements Client {

  private serverProcess: ChildProcessWithoutNullStreams
  private shuttingDown: boolean = false
  private readonly queue: PendingCommand[] = []
  private currentCommand: PendingCommand

  constructor() {
    super(o => {
      // const serverStdIn = openSync('.in', 'w+')
      // const serverStdOut = openSync('.out', 'w+')
      // const serverStdErr = openSync('.err', 'w+')
      // const stdin = createWriteStream('.in', { encoding: 'utf-8' })
      // const stdoutFile = createReadStream('.out', { encoding: 'utf-8' })
      // const stderr = createReadStream('.err', { encoding: 'utf-8' })
      // const serverStdIn = new Writable()

      // stdoutFile.on('ready', () => {
      //   // const stdout = new Writable({ defaultEncoding: 'utf-8' })
      //   // stdoutFile.pipe(stdout)
      //   stdoutFile.on('data', chunk => {
      //     const entries = chunk.toString().split('\n')
      //     entries.forEach(entry => {
      //       if (!entry) {
      //         return
      //       }
      //       const pending = this.pendingMessages.pop()
      //       if (pending) {
      //         pending.resolve(entry)
      //       }
      //       oProcess.next(entry)
      //     })
      //   })
      // })

      this.serverProcess = spawn('java', SERVER_CMD.split(' '), {
        // TODO: reuse stdin/stdout to support msm?
        cwd: process.cwd(),
        env: process.env,
        detached: true,
        // stdio: 'ignore',
        // stdio: [serverStdIn, serverStdOut, serverStdErr]
        // stdio: ['pipe', serverStdOut, 'pipe']
      })

      this.serverProcess.stdout.on('data', chunk => {
        const entries = chunk.toString().split('\n')
        entries.forEach(entry => {
          if (!entry) {
            return
          }
          const pending = this.currentCommand
          if (pending) {
            pending.resolve(entry)
          }
          o.next(entry)
        })
      })

      this.serverProcess.on('error', err => o.error(err))

      this.serverProcess.on('beforeExit', (code) => {
        console.log('SERVER PROCESS BEFOREEXIT', code)
        // oProcess.complete()
      })

      this.serverProcess.on('exit', (code) => {
        console.log('SERVER PROCESS EXIT', code)
        // oProcess.complete()
      })

      this.serverProcess.on('close', (code, signal) => {
        console.log('SERVER PROCESS CLOSE', { code, signal })
      })

      this.serverProcess.on('SIGINT', () => {
        console.warn('SERVER PROCESS SIGINT')
      })

      // this.serverProcess.unref()
      return () => {
        this.cleanShutdown('Observable cleanup')
        this.serverProcess = undefined
      }
    })

    process.on('SIGINT', () => console.log('SIGINT'))
    // process.on('SIGINT', this.cleanShutdown.bind(this, 'SIGINT'))
    process.on('SIGTERM', this.cleanShutdown.bind(this, 'SIGTERM'))
    // process.on('beforeExit', this.cleanShutdown.bind(this, 'beforeExit'))
    process.on('beforeExit', () => console.log('beforeExit'))
    process.on('exit', () => console.log('exit'))
  }

  public send(cmd: string, expectResponse: false): Promise<void>
  public send(cmd: string, expectResponse?: true): Promise<string>
  public send(cmd: string, expectResponse: boolean = true): Promise<string | void> {
    const queuedCommand = new PendingCommand(cmd, expectResponse)
    this.queue.push(queuedCommand)
    this.checkQueue()
    return queuedCommand.promise
  }

  private async checkQueue(): Promise<void> {
    if (this.currentCommand) {
      return
    }

    if (!this.serverProcess) {
      throw new Error('Not connected')
    }

    this.currentCommand = this.queue.shift()
    if (!this.currentCommand) {
      return
    }

    console.debug('[cmd]', this.currentCommand.cmd)
    this.serverProcess.stdin.write(`${this.currentCommand.cmd}\n`)
    if (this.currentCommand.expectResponse) {
      const timeout = setTimeout(() => {
        this.currentCommand.resolve(undefined)
      }, 250)
      const result = await this.currentCommand.promise
      clearTimeout(timeout)
      console.debug('  > ', result)
    } else {
      this.currentCommand.resolve(undefined)
    }
    this.currentCommand = undefined
    setTimeout(() => this.checkQueue(), 0)
  }

  private async cleanShutdown(reason: string, code?: any): Promise<void> {
    console.warn(`cleanShutdown(${reason})`)
    if (this.shuttingDown) {
      console.warn('ALREADY SHUTTING DOWN')
    } else {
      console.warn('CLEAN SHUTDOWN', code)
      this.shuttingDown = true
      const response = this.send('save-all flush')
      console.warn('SENT save-all flush')
      console.warn('save-all flush response:', await response)
    }
  }
}

export const ClientProvider: Provider<Client> = {
  provide: Client,
  useFactory(server: Server): Client {
    return server
  },
  deps: [Server],
}
