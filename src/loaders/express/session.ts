import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import { Connection } from 'mongoose'

import config from '../../config/config'

const sessionMiddlewares = (connection: Connection) => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: config.sessionSecret,
    cookie: config.cookieSettings,
    name: 'connect.sid',
    store: MongoStore.create({
      clientPromise: Promise.resolve(connection.getClient()),
      collectionName: 'sessions',
    }),
  })

  return [
    cookieParser(), // CookieParser should be above session
    expressSession,
  ]
}

export default sessionMiddlewares
