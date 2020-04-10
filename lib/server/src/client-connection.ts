import { Injectable } from '@dandi/core'
import { createConnection, Socket } from 'net'

const PORT_INDEX = process.argv.indexOf('--port')
const PORT = parseInt(process.argv[PORT_INDEX + 1], 10)

@Injectable()
export class ClientConnection {

  private conn: Socket
  private onConnected: () => void
  private onReady: () => void
  private isConnected: boolean = false
  private isReady: boolean = false
  private readonly connected: Promise<void> = new Promise<void>(resolve => this.onConnected = resolve)
  private readonly ready: Promise<void> = new Promise<void>(resolve => this.onReady = resolve)
  private readonly subscribers = new Set<any>()

  constructor() {
  }

  public connect(subscriber: any): void {
    this.subscribers.add(subscriber)
    if (this.conn) {
      return;
    }
    this.conn = createConnection({ port: PORT }, this.onConnected.bind(this));
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.conn.on(event, callback);
  }
}
