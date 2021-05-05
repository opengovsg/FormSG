angular.module('forms').component('responseAnswerArrayComponent', {
  template: '{{ vm.field.answerArray.join(", ") }}',
  bindings: {
    field: '<',
  },
  controllerAs: 'vm',
})
