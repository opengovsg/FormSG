declare module 'supertest-session' {
  import { Express } from 'express'
  import supertest, { SuperAgentTest } from 'supertest'

  export interface Session extends supertest.SuperTest<supertest.Test> {
    agent: SuperAgentTest
    app: Express
    url: string
    options: Record<string, any>
    reset: () => void

    cookies: ReturnType<SuperAgentTest['jar']['getCookies']>
  }

  export default function (app: any): Session
}
