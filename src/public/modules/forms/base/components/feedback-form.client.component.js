'use strict'

angular.module('forms').component('feedbackFormComponent', {
  templateUrl:
    'modules/forms/base/componentViews/feedback-form.client.view.html',
  bindings: {
    isPreview: '<',
    formId: '@',
    colorTheme: '@',
  },
  controller: ['FormFeedback', 'Toastr', feedbackController],
  controllerAs: 'vm',
})

function feedbackController(FormFeedback, Toastr) {
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

      vm.isSubmitted = true
      vm.isLoading = false
      Toastr.success('Thank you for your submission!')
    }
  }
}
