'use strict'

const FormFeedbackService = require('../../../../services/FormFeedbackService')

angular.module('forms').component('feedbackFormComponent', {
  templateUrl:
    'modules/forms/base/componentViews/feedback-form.client.view.html',
  bindings: {
    isPreview: '<',
    formId: '@',
    submissionId: '@',
    colorTheme: '@',
  },
  controller: ['Toastr', '$q', feedbackController],
  controllerAs: 'vm',
})

function feedbackController(Toastr, $q) {
  const vm = this

  vm.$onInit = () => {
    vm.isSubmitted = false
    vm.comment = ''
    vm.rating = null
  }

  vm.submitFeedback = function () {
    vm.isLoading = true

    if (vm.rating !== null) {
      const feedback = {
        rating: vm.rating,
        comment: vm.comment,
        isPreview: vm.isPreview,
      }

      $q.when(
        FormFeedbackService.postFeedback(vm.formId, vm.submissionId, feedback),
      ).then(
        function () {
          vm.isSubmitted = true
          vm.isLoading = false
          Toastr.success('Thank you for your submission!')
        },
        function () {
          vm.isSubmitted = true
          vm.isLoading = false
          Toastr.error(
            "It's likely your network connectivity is down. Please try again later.",
          )
        },
      )
    }
  }
}
