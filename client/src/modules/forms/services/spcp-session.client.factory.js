'use strict'

const jwtDecode = require('jwt-decode').default

angular
  .module('forms')
  .factory('SpcpSession', ['$window', '$cookies', SpcpSession])

function SpcpSession($window, $cookies) {
  let session = {
    userName: null,
    cookieName: null,
    rememberMe: null,
    issuedAt: null,
    cookieNames: {
      SP: 'jwtSp',
      CP: 'jwtCp',
    },
    setUser: function (authType) {
      if (session.cookieNames[authType]) {
        session.cookieName = session.cookieNames[authType]
        const cookie = $cookies.get(session.cookieName)
        if (cookie) {
          const decoded = jwtDecode(cookie)
          session.userName = decoded.userName
          session.rememberMe = decoded.rememberMe
          session.issuedAt = parseInt(decoded.iat)
          // Every 5 seconds, check if cookie exists and log out if cookie does not exist
          setInterval(session.checkCookie, 5000)
        }
      }
    },
    setUserName: function (userName) {
      session.userName = userName
    },
    clearUserName: function () {
      session.userName = undefined
    },
    logout: function () {
      $cookies.remove(
        session.cookieName,
        $window.spcpCookieDomain ? { domain: $window.spcpCookieDomain } : {},
      )
      $cookies.put('isJustLogOut', true)
      $window.location.reload()
    },
    checkCookie: function () {
      let cookie = $cookies.get(session.cookieName)
      if (!cookie) {
        session.logout()
      }
    },
    isJustLogOut: function () {
      let val = $cookies.get('isJustLogOut')
      $cookies.remove('isJustLogOut')
      return val
    },
    isLoginError: function () {
      let val = $cookies.get('isLoginError')
      $cookies.remove('isLoginError')
      return val
    },
    isRememberMeSet: function () {
      return session.rememberMe
    },
    getIssuedAt: function () {
      // Send in milliseconds
      return session.issuedAt * 1000
    },
  }
  return session
}
