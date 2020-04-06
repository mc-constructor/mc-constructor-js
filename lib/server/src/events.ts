import { Uuid } from '@dandi/common'
import { Inject, Injectable } from '@dandi/core'
import { OperatorFunction } from 'rxjs'
import { filter, map, share } from 'rxjs/operators'

import { SharedObservable } from '../../common'
import { Item } from '../../types'

import { Client } from './client'
import { Player } from './players'

export enum ServerEventType {
  playerJoined = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent',
  playerLeft = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedOutEvent',
}

export interface ServerEvent {
  messageId: Uuid
  type: ServerEventType
  extras: string[]
}

export interface HeldItem {
  item: Item
  itemName?: string
}

export interface PlayerWithHeldItems extends Player {
  mainHand: HeldItem
  offHand: HeldItem
}

export interface PlayerEvent extends ServerEvent {
  player: Player
}

function parseMessage([messageId, [type, ...extras]]): ServerEvent {
  return { messageId, type, extras }
}

function parsePlayerEvent(event: ServerEvent): PlayerEvent {
  const [playerRaw, mainHandRaw, offHandRaw, ...extras] = event.extras
  const [name, uuidRaw] = playerRaw.split(' ')
  const uuid = Uuid.for(uuidRaw.substring(1, uuidRaw.length - 1))
  const player: Player = { name, uuid }
  return Object.assign(event, {
    player,
    extras,
  })
}

type ServerEventParserFn<TEvent extends ServerEvent> = (event: ServerEvent) => TEvent
type ServerEventTypes = {
  [ServerEventType.playerJoined]: PlayerEvent
  [ServerEventType.playerLeft]: PlayerEvent
}
type ServerEventParserMap = { [TEventType in ServerEventType]: ServerEventParserFn<ServerEventTypes[TEventType]> }

const PARSERS: ServerEventParserMap = {
  [ServerEventType.playerJoined]: parsePlayerEvent,
  [ServerEventType.playerLeft]: parsePlayerEvent,
}

export function isEventType<TEvent extends ServerEventType>(type: TEvent, event: ServerEvent): event is ServerEventTypes[TEvent] {
  return event.type === type
}

export function eventType<TEvent extends ServerEventType>(type: TEvent): OperatorFunction<ServerEvent, ServerEventTypes[TEvent]> {
  return filter<ServerEvent, ServerEventTypes[TEvent]>(isEventType.bind(undefined, type))
}

@Injectable()
export class ServerEvents extends SharedObservable<ServerEvent> {

  public readonly client: Client

  constructor(
    @Inject(Client) client$: Client,
  ) {
    super(o => {
      const sub = client$
        .pipe(
          map(parseMessage),
          filter(event => {
            if (PARSERS[event.type]) {
              return true
            }
            console.warn(`No parser for ${event.type}`, event)
            return false
          }),
          map(event => PARSERS[event.type](event)),
          share(),
        )
        .subscribe(o)

      return sub.unsubscribe.bind(sub)
    })
  }
}
