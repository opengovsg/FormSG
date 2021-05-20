'use strict'

const { get } = require('lodash')

angular
  .module('forms')
  .directive('fieldDirective', ['FormFields', fieldDirective])

function fieldDirective(FormFields) {
  return {
    restrict: 'E',
    templateUrl:
      'modules/forms/base/directiveViews/field.client.directive.view.html',
    scope: {
      field: '=',
      required: '&',
      forms: '=',
      colortheme: '@',
      isadminpreview: '=',
      isTemplate: '=',
      transactionId: '<',
      onDropdownClick: '&',
      isValidateDate: '<',
      formId: '<',
    },
    link: function (scope) {
      if ((scope.isadminpreview || scope.isTemplate) && scope.field.myInfo) {
        // Determine whether to disable field in preview
        if (
          ['dropdown', 'checkbox', 'radiobutton'].includes(
            scope.field.fieldType,
          )
        ) {
          // Always allow admin to explore dropdown fields
          scope.field.disabled = false
        } else if (
          // Disable field if it is always verified
          ['SG', 'PR', 'F'].every((status) =>
            scope.field.myInfo.verified.includes(status),
          )
        ) {
          scope.field.disabled = true
        } else {
          scope.field.disabled = false
        }

        // Populate default values
        scope.field.fieldValue = FormFields.getMyInfoPreviewValue(
          scope.field.myInfo.attr,
        )
      }
      // Add a default description for editable MyInfo fields
      /**
       * @param       {String} myInfoAttr MyInfo attribute
       * @param       {String} readOnly Whether the field is meant for readOnly
       * @return      {String}            Description for formfield format
       */
      function _getMyInfoPlaceholder(myInfoAttr, readOnly) {
        if (readOnly) {
          return ''
        } else if (myInfoAttr === 'mobileno') {
          return '+65 9XXXXXXX'
        }
        return ''
      }

      // Insert placeholder text for MyInfo fields that are not disabled
      if (scope.field.myInfo) {
        scope.placeholder = _getMyInfoPlaceholder(
          get(scope.field, 'myInfo.attr'),
          scope.field.disabled,
        )
      }
    },
  }
}
