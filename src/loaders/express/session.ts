import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import { Connection } from 'mongoose'

import config, { nodeEnv } from '../../config/config'
import { Environment } from '../../types/config'

const sessionMiddlewares = (connection: Connection) => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: config.sessionSecret,
    cookie: config.cookieSettings,
    name: 'connect.sid',
    store:
      nodeEnv === Environment.Test
        ? new session.MemoryStore()
        : MongoStore.create({
            clientPromise: Promise.resolve(connection.getClient()),
          }),
  })

  return [
    cookieParser(), // CookieParser should be above session
    expressSession,
  ]
}

export default sessionMiddlewares
