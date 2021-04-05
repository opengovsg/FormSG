'use strict'

angular
  .module('users')
  .factory('Auth', ['$q', '$http', '$state', '$window', Auth])

function Auth($q, $http, $state, $window) {
  /**
   * Object representing a logged-in user and agency
   * @typedef {Object} User
   * @property {String} _id - The database ID of the user
   * @property {String} email - The email of the user
   * @property {Object} betaFlags - Whether the user has beta privileges for different features
   * @property {Object} agency - The agency that the user belongs to
   * @property {String} agency.created - Date created
   * @property {Array<String>} agency.emailDomain - Email domains belonging to agency
   * @property {String} agency.fullName - The full name of the agency
   * @property {String} agency.shortName - The short name of the agency
   * @property {String} agency.logo - URI specifying location of agency logo
   * @property {String} agency._id - The database ID of the agency
   */

  let authService = {
    checkUser,
    sendOtp,
    verifyOtp,
    getUser,
    setUser,
    refreshUser,
    signOut,
  }
  return authService

  /**
   * User setter function
   * @param {User} user
   */
  function setUser(user) {
    $window.localStorage.setItem('user', JSON.stringify(user))
  }

  /**
   * User getter function
   * @returns {User} user
   */
  function getUser() {
    // TODO: For backwards compatibility in case user is still logged in
    // and details are still saved on window
    let user = $window.localStorage.getItem('user')
    try {
      return user && JSON.parse(user)
    } catch (error) {
      return null
    }
  }

  function refreshUser() {
    return $http
      .get('api/v3/user')
      .then(({ data }) => {
        setUser(data)
        return data
      })
      .catch(() => {
        setUser(null)
        return null
      })
  }

  function checkUser(credentials) {
    let deferred = $q.defer()
    $http.post('/auth/checkuser', credentials).then(
      function (response) {
        deferred.resolve(response.data)
      },
      function (error) {
        deferred.reject(error.data)
      },
    )
    return deferred.promise
  }

  function sendOtp(credentials) {
    let deferred = $q.defer()
    $http.post('/auth/sendotp', credentials).then(
      function (response) {
        deferred.resolve(response.data)
      },
      function (error) {
        deferred.reject(error)
      },
    )
    return deferred.promise
  }

  function verifyOtp(credentials) {
    let deferred = $q.defer()
    $http.post('/auth/verifyotp', credentials).then(
      function (response) {
        setUser(response.data)
        deferred.resolve()
      },
      function (error) {
        deferred.reject(error)
      },
    )
    return deferred.promise
  }

  function signOut() {
    $http.get('/auth/signout').then(
      function () {
        $window.localStorage.removeItem('user')
        // Clear contact banner on logout
        $window.localStorage.removeItem('contactBannerDismissed')
        $state.go('landing')
      },
      function (error) {
        console.error('sign out failed:', error)
      },
    )
  }
}
