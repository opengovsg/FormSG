import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import { RequestHandler } from 'express'
import session from 'express-session'
import { Connection } from 'mongoose'

import config from '../../config/config'

const sessionMiddlewares = (connection: Connection): RequestHandler[] => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: config.sessionSecret,
    cookie: config.cookieSettings,
    name: 'connect.sid',
    store: MongoStore.create({
      client: connection.getClient(),
    }),
  })

  return [
    cookieParser(config.sessionSecret), // CookieParser should be above session
    expressSession,
  ]
}

export default sessionMiddlewares
