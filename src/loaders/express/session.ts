import connectMongo from 'connect-mongo'
import cookieParser from 'cookie-parser'
import session, { SessionOptions } from 'express-session'
import { Connection } from 'mongoose'

import config from '../../config/config'

const sessionMongoStore = connectMongo(session)

const sessionMiddlewares = (connection: Connection) => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: config.sessionSecret,
    // TODO(#42): Remove the typecast once `config` has correct types.
    cookie: config.cookieSettings as SessionOptions['cookie'],
    name: 'connect.sid',
    store: new sessionMongoStore({
      mongooseConnection: connection,
      collection: 'sessions',
    }),
  })

  return [
    cookieParser(), // CookieParser should be above session
    expressSession,
  ]
}

export default sessionMiddlewares
