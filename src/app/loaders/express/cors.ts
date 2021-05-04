import cors from 'cors'

import { app, corsWhiteList } from '../../config/config'

export const corsMiddleware = () => {
  return cors({
    origin: function (origin, callback) {
      // If no origin or from self, disable CORS
      if (!origin || app.appUrl === origin) {
        callback(null, false)
      } else {
        // Enable CORS only if whitelisted
        callback(null, corsWhiteList.indexOf(origin) !== -1)
      }
    },
    // Allows for setting of cookies over CORS
    credentials: true,
  })
}
