import { Observable } from 'rxjs'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { Client } from './client'

const cmdArgIndex = process.argv.indexOf('--cmd')
const cmd = process.argv[cmdArgIndex + 1]

export class Server extends Observable<string> implements Client {

  private process: ChildProcessWithoutNullStreams

  constructor() {
    super((o => {
      this.process = spawn('java', cmd.split(' '), {
        // TODO: reuse stdin/stdout to support msm?
        cwd: process.cwd(),
        env: process.env,
      })

      this.process.stdout.on('data', chunk => {
        const entries = chunk.toString().split('\n')
        entries.forEach(entry => {
          if (!entry) {
            return
          }
          o.next(entry)
        })
      })

      this.process.on('error', err => o.error(err))

      this.process.on('exit', (code) => {
        console.log('exit', code)
        o.complete()
      })

      this.process.on('close', (code, signal) => {
        console.log('close', { code, signal })
      })
      return () => {
        // TODO: clean shutdown
        if (this.process.connected) {
          this.process.stdin.write('save-all flush\n')
          this.process.kill(0)
        }
        this.process = undefined
      }
    }))
  }

  public send(cmd: string): void {
    if (!this.process) {
      throw new Error('Not connected')
    }
    this.process.stdin.write(`${cmd}\n`)
  }
}

// TODO: make "signals" based on inputs from server stdout, changes to "stats" files
// map stats UUIDs to players with usercache.json
