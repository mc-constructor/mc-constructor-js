import { Observable } from 'rxjs'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { Client } from './client'
import { share } from 'rxjs/operators'

const cmdArgIndex = process.argv.indexOf('--cmd')
const cmd = process.argv[cmdArgIndex + 1]

class PendingMessage {

  public readonly promise: Promise<string>

  private _resolve: (value: string) => void
  public get resolve(): (value: string) => void {
    return this._resolve
  }

  constructor() {
    this.promise = new Promise<string>(resolve => this._resolve = resolve)
  }
}

export class Server extends Observable<string> implements Client {

  private serverProcess: ChildProcessWithoutNullStreams
  private shuttingDown: boolean = false
  private readonly pendingMessages: PendingMessage[] = []

  constructor() {
    super((oServer => {
      const message$ = new Observable<string>(oProcess => {
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

        this.serverProcess = spawn('java', cmd.split(' '), {
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
            const pending = this.pendingMessages.shift()
            if (pending) {
              pending.resolve(entry)
            }
            oProcess.next(entry)
          })
        })

        this.serverProcess.on('error', err => oProcess.error(err))

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

      const sub = message$.pipe(share()).subscribe(oServer)
      return sub.unsubscribe.bind(sub)
    }))

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
    if (!this.serverProcess) {
      throw new Error('Not connected')
    }
    console.debug('[cmd]', cmd)
    this.serverProcess.stdin.write(`${cmd}\n`)
    if (expectResponse) {
      const pending = new PendingMessage()
      this.pendingMessages.push(pending)
      pending.promise.then(result => {
        console.debug('[cmd]', cmd, '\n  > ', result)
      })
      return pending.promise
    }
    return
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

// TODO: make "signals" based on inputs from server stdout, changes to "stats" files
// map stats UUIDs to players with usercache.json
