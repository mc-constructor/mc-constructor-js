import { Location } from '../../types';

export function fill(start: Location, end: Location, blockId: string): string {
  return `fill ${start.join(' ')} ${end.join(' ')} ${blockId}`;
}

export function set(loc: Location, blockId: string): string {
  return `setblock ${loc.join(' ')} ${blockId}`
}
