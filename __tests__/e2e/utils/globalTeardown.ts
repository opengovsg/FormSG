import { MongoMemoryServer } from 'mongodb-memory-server-core'

import setupConfig from './setupConfig'

async function globalTeardown(): Promise<void> {
  if (setupConfig.Memory) {
    // Config to decided if an mongodb-memory-server instance should be used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE
    await instance.stop()
  }
}

export default globalTeardown
