import { Inject, Injectable } from '@dandi/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SharedObservable } from '../../common'
import { Server } from './server'

export enum ServerChannel {
  main = 'main',
  thread = 'Server thread',
  worker = 'Server-Worker',
  authenticator = 'User Authenticator',
  unknown = 'channel:unknown',
}
const ServerChannelValues = Object.values(ServerChannel)

export enum ServerMessageLevel {
  trace = 'TRACE',
  debug = 'DEBUG',
  info = 'INFO',
  warn = 'WARN',
  error = 'ERROR',
  fatal = 'FATAL',
}

export interface ServerMessageSource {
  raw: string
  metaRaw: string
  channelRaw: string
  levelRaw: string
}

export interface ServerMessage {
  source: ServerMessageSource
  ts: Date
  channel: ServerChannel
  channelModifier?: string
  level: ServerMessageLevel
  content: string
}

export interface ServerChannelMessage<TChannel extends ServerChannel> extends ServerMessage {
  channel: TChannel
}

@Injectable()
export class ServerMessages extends SharedObservable<ServerMessage> {
  constructor(@Inject(Server) server$: Server) {
    super(o => server$.pipe(
      map(raw => {
        // Based on <PatternLayout pattern="%d{[HH:mm:ss.SSS]} [%t/%level] %msg%n" />
        const timeStart = 1
        const timeEnd = 13
        const [hour, min, sec, ms] = raw
          .substring(timeStart, timeEnd)
          .split(/[:.]/g)
          .map(val => parseInt(val, 10))
        const now = new Date()
        const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, sec, ms)
        const metaStart = timeEnd + 3
        const metaEnd = raw.indexOf(']', metaStart)
        const metaRaw = raw.substring(metaStart, metaEnd)
        const [channelRaw, levelRaw] = metaRaw.split('/', 2)
        const channel: ServerChannel = ServerChannelValues.includes(channelRaw as any) ? channelRaw as ServerChannel :
          ServerChannelValues.find(channel => channelRaw.startsWith(channel)) || ServerChannel.unknown
        const channelModifier = channelRaw
          .replace(channel, '')
          .trim()
          .replace(/^[#\-]/, '') || undefined
        const content = raw.substring(metaEnd + 2)
        const source = {
          raw,
          metaRaw,
          channelRaw,
          levelRaw,
        }

        return {
          ts,
          channel,
          channelModifier,
          level: levelRaw as ServerMessageLevel,
          content,
          source,
        }
      }),
    ).subscribe(o))
  }
}
