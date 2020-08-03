angular.module('forms').component('responseTitleComponent', {
  templateUrl:
    'modules/forms/admin/componentViews/response-views/response-title.client.view.html',
  bindings: {
    field: '<',
  },
  controllerAs: 'vm',
  controller: responseTitleComponentController,
})

function responseTitleComponentController() {
  const vm = this

  vm.getPrefixedQuestion = () => {
    if (vm.field.signature) {
      return `[verified] ${vm.field.question}`
    }

    // Can extend for other types of fields such as verified fields in the
    // future, similar to `email-submissions.server.controller`

    return vm.field.question
  }
}
