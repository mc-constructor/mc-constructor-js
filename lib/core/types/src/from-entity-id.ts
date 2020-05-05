/**
 * converts an entity id to a specific enum value
 * @param entityId eg. item.minecraft.cod -> Item.cod (minecraft:cod)
 */
import { Item } from './item'

const types: { [key: string]: string[] } = {
  item: [...Object.values(Item)],
}

export function fromEntityId(entityId: string): Item {
  const [type, namespace, id] = entityId.split('.')
  const typeValues = types[type]
  if (!typeValues) {
    throw new Error(`Unexpected item type in entity id '${entityId}'`)
  }
  if (namespace !== 'minecraft') {
    throw new Error(`Unexpected namespace in entity id '${entityId}'`)
  }
  const enumValue = `${namespace}:${id}`
  if (typeValues.includes(enumValue)) {
    return enumValue as Item
  }
  throw new Error(`Unexpected id in entity id '${entityId}'`)
}