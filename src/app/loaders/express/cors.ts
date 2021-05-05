import cors from 'cors'

import { app, corsWhitelist } from '../../config/config'

export const corsMiddleware = () => {
  return cors({
    origin: function (origin, callback) {
      // If no origin or from self, disable CORS
      if (!origin || app.appUrl === origin) {
        callback(null, false)
      } else {
        // Enable CORS only if whitelisted
        callback(null, corsWhitelist.includes(origin))
      }
    },
    // Allows for setting of cookies over CORS
    credentials: true,
  })
}
