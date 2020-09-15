declare module 'express-device' {
  import { RequestHandler } from 'express'

  type UserAgentDevice = 'desktop' | 'tv' | 'tablet' | 'phone' | 'bot' | 'car'

  type CaptureOptions = {
    emptyUserAgentDeviceType?: UserAgentDevice
    unknownUserAgentDeviceType?: UserAgentDevice
    botUserAgentDeviceType?: UserAgentDevice
    carUserAgentDeviceType?: UserAgentDevice
    parseUserAgent?: boolean
  }

  function capture(options: CaptureOptions): RequestHandler

  // This typing is incomplete, to be typed when other functionality is needed.
  // See https://github.com/rguerreiro/express-device/blob/master/lib/device.js
  // for the module exports.

  export default {
    capture,
  }
}
