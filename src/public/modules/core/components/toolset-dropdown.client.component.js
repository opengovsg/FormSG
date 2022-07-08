'use strict'

angular.module('core').component('toolsetDropdownComponent', {
  templateUrl: 'modules/core/componentViews/toolset-dropdown.html',
  controller: ['$scope', toolsetDropdownController],
  controllerAs: 'vm',
})

function toolsetDropdownController($scope) {
  /**
   * Logic for dropdown component. Add to labelAndLink to add more websites to the dropdown.
   */
  const vm = this

  vm.isDropdownHover = false
  vm.isDropdownFocused = false
  vm.isDropdownOpen = false
  vm.labelAndLink = [
    { label: 'Short Links', link: 'https://go.gov.sg/' },
    { label: 'Mass Messaging', link: 'https://go.gov.sg/postmangovsg' },
    { label: 'Eligibility Checker', link: 'https://go.gov.sg/checkfirstgovsg' },
    { label: 'Voucher Distribution', link: 'https://go.gov.sg/redeemgovsg' },
    { label: 'Website Builder', link: 'https://go.gov.sg/isomergovsg' },
    { label: 'Citizen Identity', link: 'https://go.gov.sg/idgovsg' },
  ]

  $scope.$watchGroup(
    ['vm.isDropdownHover', 'vm.isDropdownFocused'],
    function (newValues) {
      vm.isDropdownOpen = newValues[0] || newValues[1]
    },
  )
}
