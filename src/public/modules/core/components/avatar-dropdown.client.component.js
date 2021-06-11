const get = require('lodash/get')

const AuthService = require('../../../services/AuthService')
const UserService = require('../../../services/UserService')

angular.module('core').component('avatarDropdownComponent', {
  templateUrl: 'modules/core/componentViews/avatar-dropdown.html',
  bindings: {},
  controller: [
    '$q',
    '$scope',
    '$state',
    '$uibModal',
    '$window',
    'Toastr',
    avatarDropdownController,
  ],
  controllerAs: 'vm',
})

function avatarDropdownController(
  $q,
  $scope,
  $state,
  $uibModal,
  $window,
  Toastr,
) {
  const vm = this

  // Preload user with current details, redirect to signin if unable to get user
  vm.user = UserService.getUserFromLocalStorage() || $state.go('signin')
  vm.avatarText = generateAvatarText()

  vm.isDropdownHover = false
  vm.isDropdownFocused = false

  // Attempt to retrieve the most updated user.
  retrieveUser()

  async function retrieveUser() {
    try {
      const trueUser = await UserService.fetchUser()
        .then((user) => {
          UserService.saveUserToLocalStorage(user)
          return user
        })
        .catch(() => {
          UserService.clearUserFromLocalStorage()
          return null
        })

      if (!trueUser) {
        $state.go('signin')
        return
      }

      vm.user = trueUser

      // Early return if user already has contact information.
      if (trueUser.contact) return

      // Only show exclamation mark in avatar if sms feature is enabled.
      vm.showExclamation = !vm.user.contact

      // If retrieved user does not have contact, prompt user to add one.
      // If user has the key in the browser's storage the modal will not be
      // shown.
      const hasBeenDismissed = $window.localStorage.getItem(
        'contactBannerDismissed',
      )
      if (!hasBeenDismissed) {
        vm.openContactNumberModal()
      }
    } catch (err) {
      Toastr.error(err)
    }
  }

  vm.isDropdownOpen = false

  $scope.$watchGroup(
    ['vm.isDropdownHover', 'vm.isDropdownFocused'],
    function (newValues) {
      vm.isDropdownOpen = newValues[0] || newValues[1]
    },
  )

  vm.logout = () => {
    return $q
      .when(AuthService.logout())
      .then(() => {
        // Clear user and contact banner on logout
        UserService.clearUserFromLocalStorage()
        $window.localStorage.removeItem('contactBannerDismissed')
        // Redirect to landing page
        $state.go('landing')
      })
      .catch((error) => {
        console.error('sign out failed:', error)
      })
  }

  vm.openContactNumberModal = () => {
    $uibModal
      .open({
        animation: false,
        keyboard: false,
        backdrop: 'static',
        windowClass: 'ecm-modal-window',
        templateUrl: 'modules/core/views/edit-contact-number-modal.view.html',
        controller: 'EditContactNumberModalController',
        controllerAs: 'vm',
      })
      .result.then((returnVal) => {
        // Update success, update user.
        if (returnVal) {
          vm.user = returnVal
          UserService.saveUserToLocalStorage(returnVal)
          vm.showExclamation = !returnVal.contact
        }
      })
      .finally(angular.noop)
  }

  function generateAvatarText() {
    const userEmail = get(vm.user, 'email')
    if (userEmail) {
      // Get first two characters of name.
      return userEmail.split('@')[0].slice(0, 2) || '?'
    }

    return '?'
  }
}
