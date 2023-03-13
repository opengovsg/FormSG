/* eslint-disable no-undef */
const { createProxyMiddleware } = require('http-proxy-middleware')

// Added a proxy middleware as api routes with text/html in its Accept header
// were not getting redirected to the proxy
// Reference: https://create-react-app.dev/docs/proxying-api-requests-in-development/
module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
    }),
  )
}
