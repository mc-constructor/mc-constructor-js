import { Coordinates, isCoordinates } from './coordinates'

export interface Area {
  start: Coordinates
  end: Coordinates

  contains(point: Coordinates): boolean
}

class AreaImpl implements Area {
  constructor(public readonly start: Coordinates, public readonly end: Coordinates) {}

  public contains(point: Coordinates): boolean {
    return point.x.between(this.start.x, this.end.x) &&
      point.y.between(this.start.y, this.end.y) &&
      point.z.between(this.start.z, this.end.z)
  }

  public get [Symbol.toStringTag]() {
    return `Area (${this.start}) ~ (${this.end})`
  }
}

export function isArea(obj: any): obj is Area {
  return obj && isCoordinates(obj.start) && isCoordinates(obj.end)
}

export function area(start: Coordinates, end: Coordinates): Area {
  return new AreaImpl(start, end)
}
