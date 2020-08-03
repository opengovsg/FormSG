'use strict'

angular
  .module('forms')
  .controller('ResultsPanelController', [ResultsPanelController])

function ResultsPanelController() {
  const vm = this

  vm.tabs = [
    { title: 'Responses', route: 'responses', active: true },
    { title: 'Feedback', route: 'feedback', active: false },
  ]
  vm.activeResultsTab = 'responses'

  vm.setActiveResultsTab = (value) => {
    vm.activeResultsTab = value
  }
}
