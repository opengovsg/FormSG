'use strict'

const { get } = require('lodash')
// const queryString = require('query-string')

angular
  .module('forms')
  .directive('fieldDirective', ['FormFields', '$location', fieldDirective])

function fieldDirective(FormFields, $location) {
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
    },
    link: function (scope) {
      // Stealth prefill feature
      // If a query parameter is provided to a form URL in the form ?<fieldId1>=<value1>&<fieldId2>=<value2>...
      // And if the fieldIds are valid mongoose object IDs and refer to a short text field,
      // Then prefill and disable editing the corresponding form field on the frontend

      const queryParams = $location.search()

      if (
        scope.field._id in queryParams &&
        scope.field.fieldType === 'textfield'
      ) {
        scope.field.fieldValue = queryParams[scope.field._id]
        scope.field.disabled = true
      }

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
        } else if (myInfoAttr === 'homeno') {
          return '+65 6XXXXXXX'
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
