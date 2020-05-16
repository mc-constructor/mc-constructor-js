import { BaseEntityData } from './base-entity-data'

export class Creeper {
  public static readonly powered = 1
}

export interface CreeperData extends BaseEntityData {
  powered?: typeof Creeper.powered
}
