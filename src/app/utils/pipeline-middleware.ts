type Next = () => Promise<void> | void

export type Middleware<T> = (context: T, next: Next) => Promise<void> | void

type PipelineType<T> = {
  push: (...middlewares: Middleware<T>[]) => void
  execute: (context: T) => Promise<boolean>
  getLength: () => number
}

/**
 * @description
 * Create a middle pipeline that executes a list of middlewares in sequence.
 *
 * Use-case: You have a list of pure functions that should accept or reject a request
 * based on some conditions.
 *
 * If the function accepts the condition, the next function in the pipeline will be
 * exceuted. If the function rejects the condition, the whole pipeline will be terminated.
 *
 * @example
 * import { ensureIsEven, ensureIsMultipleOfThree } from './ensures'
 * const ensureIsPositive: Middleware<number> = async (context: number, next) => {
 *    if(number <= 0) {
 *      console.log('Number not positive')
 *      return 'Number must be positive'
 *    }
 *    return next()
 * }
 *
 * const ensurePipeline = new Pipeline(
 *    ensureIsPositive,
 *    ensureIsEven,
 *    ensureIsMultipleOfThree
 * )
 * const hasEnsuredAll = await ensurePipeline.execute(18) // true
 *
 * @constructor middlewares list of middlewares to be executed in sequence
 */
export class Pipeline<T> {
  private queue: Middleware<T>[]
  constructor(...middlewares: Middleware<T>[]) {
    this.queue = middlewares
  }

  /**
   * Pushes a list of middlewares into the pipeline queue
   *
   * @param middlewares list of middlewares to be pushed into pipeline queue
   */
  push: PipelineType<T>['push'] = (...middlewares) => {
    this.queue.push(...middlewares)
  }

  /**
   * Gets the total number of middlewares in the pipeline queue
   *
   * @returns total number of middlewares in the pipeline queue
   */
  getLength: PipelineType<T>['getLength'] = () => this.queue.length

  /**
   * Begins the execution of the pipeline with context passed to each middleware
   *
   * @param context context object to be passed to each middleware
   * @returns Promise<boolean> return true if all middlewares are executed successfully
   */
  execute: PipelineType<T>['execute'] = async (context) => {
    let prevIndex = -1

    const runner = async (index: number): Promise<void> => {
      if (index === prevIndex) {
        // eslint-disable-next-line typesafe/no-throw-sync-func
        throw new Error('next() called multiple times')
      }

      prevIndex = index

      const middleware = this.queue[index]

      if (middleware) {
        await middleware(context, () => {
          return runner(index + 1)
        })
      }
    }

    await runner(0)
    return prevIndex === this.getLength()
  }
}
