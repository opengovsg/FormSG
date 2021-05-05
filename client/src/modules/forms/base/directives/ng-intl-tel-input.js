/**
 * ngIntlTelInput module forked from https://github.com/hodgepodgers/ng-intl-tel-input
 * This module has been updated for v1.7.
 */

const {
  isMobilePhoneNumber,
  isHomePhoneNumber,
  startsWithSgPrefix,
} = require('shared/util/phone-num-validation')

angular
  .module('ngIntlTelInput')
  .provider('ngIntlTelInput', ngIntlTelInputProvider)

function ngIntlTelInputProvider() {
  var me = this
  var props = {}
  var setFn = function (obj) {
    if (typeof obj === 'object') {
      for (var key in obj) {
        props[key] = obj[key]
      }
    }
  }
  me.set = setFn

  me.$get = [
    '$log',
    function ($log) {
      return Object.create(me, {
        init: {
          value: function (elm) {
            if (!window.intlTelInputUtils) {
              $log.warn(
                'intlTelInputUtils is not defined. Formatting and validation will not work.',
              )
            }
            elm.intlTelInput(props)
          },
        },
      })
    },
  ]
}

angular
  .module('ngIntlTelInput')
  .directive('ngIntlTelInput', [
    'ngIntlTelInput',
    '$log',
    '$window',
    '$parse',
    ngIntlTelInput,
  ])

function ngIntlTelInput(ngIntlTelInput, $log, $window, $parse) {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      allowIntlNumbers: '<',
      isHomeNumber: '<',
    },
    link: function (scope, elm, attr, ctrl) {
      /**
       * Validates that user input is a mobile number
       * @param {String} value The number to validate
       * @returns {Boolean} True if empty string or valid number, false otherwise
       */
      ctrl.$validators.isValidPhoneNumber = function (value) {
        if (!value) return true
        if (scope.isHomeNumber) return isHomePhoneNumber(value)
        return isMobilePhoneNumber(value)
      }

      /**
       * Validates that user input starts with Singapore prefix
       * @param {String} value The number to validate
       * @returns {Boolean} True if empty string or valid prefix, false otherwise
       */
      ctrl.$validators.startsWithSgPrefix = function (value) {
        if (!value || scope.allowIntlNumbers) return true
        else return startsWithSgPrefix(value)
      }

      /**
       * Prevent users from typing '+' when international numbers are not
       * allowed. This prevents users from changing the expected country from
       * Singapore to another country.
       */
      ctrl.$parsers.push((value) => {
        const onlyNumRegex = /^[0-9]*$/

        if (scope.allowIntlNumbers || !value || value.match(onlyNumRegex)) {
          // Allow international numbers and thus only remove alphabets.
          // Only allow phone like digits
          const transformedValue = value.replace(/([^\d+()-])/g, '')
          ctrl.$setViewValue(transformedValue)
          ctrl.$render()
          return transformedValue
        }

        // Remove all non-digit characters from value
        const transformedValue = value.replace(/\D/g, '')
        ctrl.$setViewValue(transformedValue)
        ctrl.$render()
        return transformedValue
      })

      /**
       * Sets $modelValue from $viewValue in ngModelController pipeline
       */
      ctrl.$parsers.push(function (_value) {
        return elm.intlTelInput('getNumber')
      })

      /**
       * Formats $viewValue from $modelValue in ngModelController pipeline
       */
      ctrl.$formatters.push(function (value) {
        if (value) {
          if (value.charAt(0) !== '+') {
            value = '+' + value
          }
          elm.intlTelInput('setNumber', value)
        }
        return value
      })

      /**
       * Convenience function to set model values
       * @param {Object} model attribute property
       * @param {String} value value to set the attribute
       */
      function setAttribute(model, value) {
        const getter = $parse(model)
        const setter = getter.assign
        setter(scope, value)
      }

      // Handle dropdown change
      function handleCountryChange() {
        if (attr.selectedCountry) {
          setAttribute(
            attr.selectedCountry,
            elm.intlTelInput('getSelectedCountryData'),
          )
        }
        ctrl.$setViewValue(elm.intlTelInput('getNumber'), 'countrychange')
      }
      // Teardown listeners when element is destroyed
      function cleanUp() {
        angular.element($window).off('countrychange', handleCountryChange)
      }

      // Warning for bad directive usage.
      if (
        (!!attr.type && attr.type !== 'text' && attr.type !== 'tel') ||
        elm[0].tagName !== 'INPUT'
      ) {
        $log.warn(
          'ng-intl-tel-input can only be applied to a *text* or *tel* input',
        )
        return
      }

      // Configuration
      if (scope.allowIntlNumbers) {
        ngIntlTelInput.set({ allowDropdown: true })
      } else {
        ngIntlTelInput.set({ allowDropdown: false })
      }
      // Override default country if supplied
      if (attr.initialCountry) {
        ngIntlTelInput.set({ initialCountry: attr.initialCountry })
      }

      // Set correct placeholder for home number and mobile number
      if (scope.isHomeNumber) {
        ngIntlTelInput.set({
          placeholderNumberType: 'FIXED_LINE',
        })
      } else {
        ngIntlTelInput.set({
          placeholderNumberType: 'MOBILE',
        })
      }

      // Override selected country if supplied
      if (attr.selectedCountry) {
        setAttribute(
          attr.selectedCountry,
          elm.intlTelInput('getSelectedCountryData'),
        )
      }
      // Initialisation
      ngIntlTelInput.init(elm)

      // Register listeners
      angular.element($window).on('countrychange', handleCountryChange) // new country selected from dropdown

      scope.$on('$destroy', cleanUp)
    },
  }
}
