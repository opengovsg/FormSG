/* eslint-disable no-undef */
const { createProxyMiddleware } = require('http-proxy-middleware')

// Added a proxy middleware, as requests to api routes with text/html in their Accept header
// were not getting proxied to the backend
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
