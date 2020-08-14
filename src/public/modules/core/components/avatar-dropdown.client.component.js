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
  vm.avatarText = generateAvatarText()

  vm.isDropdownOpen = false

  vm.signOut = () => Auth.signOut()

  vm.openContactNumberModal = () => {
    vm.isDropdownOpen = false

    $uibModal.open({
      animation: false,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'ecm-modal-window',
      templateUrl: 'modules/core/views/edit-contact-number-modal.view.html',
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
