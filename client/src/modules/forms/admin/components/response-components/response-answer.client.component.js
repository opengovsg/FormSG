angular.module('forms').component('responseAnswerComponent', {
  template: '{{ vm.field.answer }}',
  bindings: {
    field: '<',
  },
  controllerAs: 'vm',
})
