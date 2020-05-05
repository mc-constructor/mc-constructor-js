import { Disposable } from '@dandi/common'
import { SubscriptionTracker } from '@ts-mc/common/rxjs'

export const CodslapOwner = Disposable.makeDisposable({}, () => {
  SubscriptionTracker.instance.release(CodslapOwner)
})

export function cleanup(): void {
  CodslapOwner.dispose('cleanup')
}
