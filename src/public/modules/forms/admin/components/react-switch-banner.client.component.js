'use strict'

const AdminService = require('../../../../services/AdminService')
// const {
//   UiCookieValues,
// } = require('../../../../../app/modules/react-migration/react-migration.controller')
// const { $q } = require('angular-ui-router')
angular.module('core').component('reactSwitchBannerComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/react-switch-banner.client.view.html',
  controller: ['$q', '$window', reactSwitchBannerController],
  controllerAs: 'vm',
})

function reactSwitchBannerController($q, $window) {
  const vm = this
  vm.env = 'react' //UiCookieValues.React
  // $scope.env = 'react'//UiCookieValues.React

  // $scope.adminChooseEnvironment = await AdminService.adminChooseEnvironment(env)
  // const reactSwitch = await AdminService.adminChooseEnvironment(env)
  // vm.envSwitch = reactSwitch
  // $scope.adminChooseEnvironment = (env) => {
  //   return $q.when(AdminService.adminChooseEnvironment(env))
  // }
  vm.adminChooseEnvironment = (env) => {
    return (
      $q
        .when(AdminService.adminChooseEnvironment(env))
        // Reload the page after changing the environment cookie
        .then($window.location.reload())
        .catch((error) => {
          console.error('switch to react failed:', error)
        })
    )
  }
}
