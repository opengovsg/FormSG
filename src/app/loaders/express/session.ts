import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import { RequestHandler } from 'express'
import session from 'express-session'
import { Connection } from 'mongoose'

import config from '../../config/config'

export const ADMIN_LOGIN_SESSION_COOKIE_NAME = config.isDevOrTest
  ? 'formsg.connect.sid'
  : 'connect.sid'

const sessionMiddlewares = (connection: Connection): RequestHandler[] => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: config.sessionSecret,
    cookie: config.cookieSettings,
    // TODO: FRM-1512: Standardise cookie name across environments
    name: ADMIN_LOGIN_SESSION_COOKIE_NAME,
    store: MongoStore.create({
      // @ts-expect-error Property 'isConnected' is missing in type
      client: connection.getClient(),
    }),
  })

  return [
    cookieParser(config.sessionSecret), // CookieParser should be above session
    expressSession,
  ]
}

export default sessionMiddlewares
