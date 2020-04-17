import { Command } from '@minecraft/core/command'
import { Coordinates } from '@minecraft/core/types'
import { Observable } from 'rxjs'

export interface Arena {

  init(): Command
  cleanup(): Command
  run(): Observable<any>

  getRandomSpawn(): Coordinates

  onPlayerRespawn(): Command
}
