const get = require('lodash/get')

angular.module('core').component('avatarDropdownComponent', {
  templateUrl: 'modules/core/componentViews/avatar-dropdown.html',
  bindings: {},
  controller: ['$state', 'Auth', avatarDropdownController],
  controllerAs: 'vm',
})

function avatarDropdownController($state, Auth) {
  const vm = this

  // Redirect to signin if unable to get user
  vm.user = Auth.getUser() || $state.go('signin')
  vm.avatarText = generateAvatarText()

  vm.isDropdownOpen = false

  vm.signOut = () => Auth.signOut()

  function generateAvatarText() {
    const userEmail = get(vm.user, 'email')
    if (userEmail) {
      // Get first two characters of name.
      return userEmail.split('@')[0].slice(0, 2) || '?'
    }

    return '?'
  }
}
