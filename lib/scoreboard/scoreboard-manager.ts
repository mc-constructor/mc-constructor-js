import { Inject, Injectable } from '@dandi/core'

import { ServerEvents } from '../server'

@Injectable()
export class ScoreboardManager {

  constructor(
    @Inject(ServerEvents) private readonly events$: ServerEvents,
  ) {
  }

}
