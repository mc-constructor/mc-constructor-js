import { MonoTypeOperatorFunction } from 'rxjs'
import { filter } from 'rxjs/operators'

export const silence = filter(() => false) as MonoTypeOperatorFunction<never>
