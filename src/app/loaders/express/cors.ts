import cors from 'cors'

import { app, corsWhitelist } from '../../config/config'

export const corsMiddleware = () => {
  return cors({
    origin: function (origin, callback) {
      const isOriginAllowed =
        // Allow server-to-server requests.
        !origin ||
        // Allow requests from own origin.
        app.appUrl === origin ||
        // Allow requests from whitelisted domains.
        corsWhitelist.includes(origin)

      callback(null, isOriginAllowed)
    },
    // Allows for setting of cookies over CORS
    credentials: true,
  })
}
