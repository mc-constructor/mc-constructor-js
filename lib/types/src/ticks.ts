export interface Ticks extends Number {
  value: number
  seconds: number
  millis: number
}

export const TICKS_PER_SECOND = 20

class TicksImpl extends Number {

  public static fromMillis(value: number): Ticks {
    return new TicksImpl(value / 1000 * TICKS_PER_SECOND, value / 1000, value)
  }

  public static fromSeconds(value: number): Ticks {
    return new TicksImpl(value * TICKS_PER_SECOND, value, value * 1000)
  }

  public static fromTicks(value: number): Ticks {
    return new TicksImpl(value, value / TICKS_PER_SECOND, value / TICKS_PER_SECOND * 1000)
  }

  private constructor(public readonly value: number, public readonly seconds: number, public readonly millis: number) {
    super(value)
  }

  public valueOf(): number {
    return this.value
  }
}

export function ticks(value: number): Ticks {
  return TicksImpl.fromTicks(value)
}

export function ticksFromSeconds(value: number): Ticks {
  return TicksImpl.fromSeconds(value)
}

export function ticksFromMillis(value: number): Ticks {
  return TicksImpl.fromMillis(value)
}
