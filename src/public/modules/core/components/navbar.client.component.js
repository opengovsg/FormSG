'use strict'

angular.module('core').component('navbarComponent', {
  templateUrl: 'modules/core/componentViews/navbar.html',
  controller: ['$state', NavBarController],
  controllerAs: 'vm',
})

function NavBarController($state) {
  const vm = this
  vm.activeTab = $state.current.name
}
