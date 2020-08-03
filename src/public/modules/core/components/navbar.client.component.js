'use strict'

angular.module('core').component('navbarComponent', {
  templateUrl: 'modules/core/componentViews/navbar.html',
  controller: ['Auth', '$state', NavBarController],
  controllerAs: 'vm',
})

function NavBarController(Auth, $state) {
  const vm = this

  vm.signOut = () => Auth.signOut()
  vm.activeTab = $state.current.name
}
