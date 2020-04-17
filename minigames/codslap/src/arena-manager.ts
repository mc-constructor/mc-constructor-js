import { Inject, Injectable } from '@dandi/core'

import { Arena } from './arena/arena'
import { BedrockPitArena } from './arena/bedrock-pit.arena'
import { BoringArena } from './arena/boring.arena'

@Injectable()
export class ArenaManager {

  constructor(
    // @Inject(BoringArena) public readonly current: Arena,
    @Inject(BedrockPitArena) public readonly current: Arena,
  ) {}

}
