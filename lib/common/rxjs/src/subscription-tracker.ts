import { Disposable } from '@dandi/common'
import { InjectionToken, Provider } from '@dandi/core'
import { Subscription } from 'rxjs'

export type SubscriptionOwner = Disposable

export interface SubscriptionTracker {
  /**
   * Adds one or more subscriptions to be tracked using the specified owner.
   *
   * Seeing 'Subscription' is not assignable to parameter of type 'never'? The first argument needs to be the owner
   * of the subscription, not a subscription.
   * @param owner
   * @param subs
   */
  track(owner: SubscriptionOwner, ...subs: Subscription[]): void

  /**
   * Unsubscribes from any subscription tracked for the specified owner.
   *
   * Seeing 'Subscription' is not assignable to parameter of type 'never'? The first argument needs to be the owner
   * of the subscription, not a subscription.
   * @param owner
   */
  release(owner: SubscriptionOwner): void
}

let instance: SubscriptionTracker


class SubscriptionTrackerImpl implements SubscriptionTracker, Disposable {

  private readonly subscriptions = new Map<SubscriptionOwner, Set<Subscription>>()

  constructor() {
    if (instance) {
      throw new Error('Already have an instance!')
    }
    instance = this
  }

  public track(owner: SubscriptionOwner, ...subs: Subscription[]): void {
    this.validateOwner(owner)
    const tracked = this.subscriptions.get(owner) || new Set<Subscription>()
    subs.forEach(tracked.add.bind(tracked))
    this.subscriptions.set(owner, tracked)
  }

  public release(owner: SubscriptionOwner): void {
    this.validateOwner(owner)
    const tracked = this.subscriptions.get(owner)
    if (!tracked) {
      return
    }
    tracked.forEach(sub => sub.unsubscribe())
    tracked.clear()
    this.subscriptions.delete(owner)
  }

  public dispose(reason: string): void | Promise<void> {
    for (const owner of this.subscriptions.keys()) {
      this.release(owner)
    }
  }

  private validateOwner(owner: any): void {
    if (owner instanceof Subscription || owner instanceof SubscriptionTrackerImpl) {
      throw new Error('Invalid type for owner')
    }
  }

}

export type SubscriptionTrackerToken = InjectionToken<SubscriptionTracker> & { readonly instance: SubscriptionTracker }

export const SubscriptionTracker: SubscriptionTrackerToken = Object.defineProperties(function SubscriptionTracker() {},
  {
    instance: {
      get(): SubscriptionTracker {
        return instance || new SubscriptionTrackerImpl()
      }
    }
  },
)


export const SubscriptionTrackerProvider: Provider<SubscriptionTracker> = {
  provide: SubscriptionTracker,
  useFactory: () => SubscriptionTracker.instance,
}
