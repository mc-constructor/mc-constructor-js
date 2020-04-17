import { Inject, Injectable } from '@dandi/core'
import { Block, loc } from '@minecraft/core/types'
import { Observable } from 'rxjs'

import { CommonCommands } from '../common'

import { PlatformArena, PlatformLayer } from './platform-arena'

@Injectable()
export class BoringArena extends PlatformArena {

  public readonly floor: PlatformLayer = {
    radius: 15,
    block: Block.grassBlock,
    centerOffset: loc(0, 25, 0),
    depth: 1,
  }
  public readonly layers: PlatformLayer[] = [this.floor]

  constructor(
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super(common.center)
  }

  public run(): Observable<any> {
    return new Observable<any>()
  }
}
