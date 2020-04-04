import { Inject, Injectable } from '@dandi/core'
import { merge, Observable } from 'rxjs'
import { filter, map, share } from 'rxjs/operators'

import { Client } from './client'

export enum ServerEvent {
  playerJoined = 'playerJoined',
  playerLeft = 'playerLeft',
}

@Injectable()
export class ServerEvents {

  public readonly client: Client

  constructor(
    @Inject(Client) server: Client,
  ) {
    this.client = server
  }
}
