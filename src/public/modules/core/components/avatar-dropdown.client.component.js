const get = require('lodash/get')

angular.module('core').component('avatarDropdownComponent', {
  templateUrl: 'modules/core/componentViews/avatar-dropdown.html',
  bindings: {},
  controller: ['$state', '$uibModal', 'Auth', avatarDropdownController],
  controllerAs: 'vm',
})

function avatarDropdownController($state, $uibModal, Auth) {
  const vm = this

  // Redirect to signin if unable to get user
  vm.user = Auth.getUser() || $state.go('signin')
  vm.user.contact = '+65 83221353'
  vm.avatarText = generateAvatarText()

  vm.isDropdownOpen = false

  vm.signOut = () => Auth.signOut()

  vm.openContactNumberModal = () => {
    $uibModal.open({
      animation: false,
      template: '<div>Hello world</div>',
      windowClass: 'full-screen-modal-window',
      controller: 'EditContactNumberModalController',
      controllerAs: 'vm',
    }).result.finally(angular.noop).then(angular.noop, angular.noop)
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
