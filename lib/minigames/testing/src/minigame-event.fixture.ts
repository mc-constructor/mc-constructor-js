import { Observable, merge, NEVER } from 'rxjs'
import { share } from 'rxjs/operators'

/**
 * A helper for simulating events provided by {@link MinigameEvents} and its subclasses.
 *
 * Real event streams from {@link MinigameEvents} don't end or restart after resubscribing - merging with {@link NEVER}
 * and piping through {@link share} ensures that test streams act the same way.
 * @param source
 */
export function minigameEventFixture<T>(source: Observable<T>): Observable<T> {
  return merge(source, NEVER).pipe(share())
}
