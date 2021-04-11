import { Constructor } from '@dandi/common'
import {
  Inject,
  Injectable,
  InjectionScope,
  Injector,
  LogCallOptions,
  Logger,
  LogLevel,
  LogStream,
  Now,
  NowFn
} from '@dandi/core'
import { LoggerBase, QueueingLogger } from '@dandi/core/internal'

let factory: LoggerFactory

interface Logging {
  stream: LogStream
  logger: Logger
}

class DeferredLogger extends LoggerBase {

  constructor(
    queue: QueueingLogger,
    deferredLogging: Promise<Logging>
  ) {
    super()
    this.log = (queue as any).log.bind(queue)
    deferredLogging.then(logging => {
      queue.flush(logging.stream)
      this.log = (logging.logger as any).log.bind(logging.logger)
    })
  }

  protected log(level: LogLevel, options: LogCallOptions, ...args: any[]): void {}
}

@Injectable()
export class LoggerFactory {

  constructor(
    @Inject(Injector) private injector: Injector,
    @Inject(Now) private now: NowFn,
  ) {}

  public init(): void {
    factory = this
  }

  public getLogger(host: Constructor): Logger {
    const scope: InjectionScope = host
    const queue = new QueueingLogger(scope, this.now)
    const child = this.injector.createChild(scope)
    const deferredLogger = child.inject(Logger)
    const deferredLogStream = child.inject(LogStream)
    const deferredLogging = Promise.all([deferredLogger, deferredLogStream])
      .then(([logger, stream]) => ({ logger, stream }))
    return new DeferredLogger(queue, deferredLogging)
  }

}

export const loggerFactory: LoggerFactory = Object.defineProperties({}, {
  getLogger: {
    value: function getLogger(host: Constructor): Logger {
      if (!factory) {
        throw new Error('LoggerFactory has not been instantiated yet')
      }

      return factory.getLogger(host)
    },
    configurable: true,
  },
  init: {
    value: () => { throw new Error('LoggerFactory.init() must be called on an injected LoggerFactory.') },
  },
})
