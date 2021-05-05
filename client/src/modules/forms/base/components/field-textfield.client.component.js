'use strict'

const querystring = require('querystring')

angular.module('forms').component('textFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-textfield.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    placeholder: '<',
  },
  controller: ['$location', '$sanitize', textFieldComponentController],
  controllerAs: 'vm',
})

function textFieldComponentController($location, $sanitize) {
  // If a query parameter is provided to a form URL in the form ?<fieldId1>=<value1>&<fieldId2>=<value2>...
  // And if the fieldIds are valid mongoose object IDs and refer to a short text field,
  // Then prefill and disable editing the corresponding form field on the frontend

  const vm = this
  vm.$onInit = () => {
    const query = $location.url().split('?')
    const queryParams =
      query.length > 1 ? querystring.parse(query[1]) : undefined

    if (
      !vm.field.myInfo && // disallow prefill for myinfo
      vm.field.allowPrefill && // allow prefill only if flag enabled
      queryParams &&
      vm.field._id in queryParams
    ) {
      const prefillValue = queryParams[vm.field._id]
      if (typeof prefillValue === 'string' && prefillValue.length > 0) {
        // Only support unique query params. If query params are duplicated,
        // none of the duplicated keys will be prefilled
        vm.field.fieldValue = $sanitize(prefillValue) // $sanitize as a precaution to prevent xss
        // note that there are currently no unit tests to ensure that value is sanitized correctly; manual testing required

        // Indicate that field is prefilled
        vm.field.isPrefilled = true
      }
    }
  }
}
