import { ValueMap } from './value-map'

export class TagMap<
  TMap extends { [key: string]: any },
  TKey extends keyof TMap = keyof TMap,
  TValue extends TMap[TKey] = TMap[TKey],
> extends ValueMap<TKey, TValue>{

  public get<TGetKey extends TKey>(key: TGetKey): TMap[TGetKey] {
    return super.get(key) as TMap[TGetKey]
  }

  public set<TSetKey extends TKey>(key: TSetKey, value: TMap[TSetKey]): this {
    return super.set(key, value)
  }

}
