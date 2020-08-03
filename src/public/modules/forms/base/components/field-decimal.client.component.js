'use strict'

const MAX_FRACTION_DIGITS = 20 // maximum allowed for number formatting option

angular.module('forms').component('decimalFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-decimal.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
  },
  controller: decimalFieldComponentController,
  controllerAs: 'vm',
})

function decimalFieldComponentController() {
  const vm = this

  /**
   * Formats the number to have commas, etc.
   * @return {Number} Language-sensitive representation of the number
   */
  vm.formatNumber = function (num) {
    const formatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: MAX_FRACTION_DIGITS,
    }
    if (typeof num !== 'number') {
      return num
    }
    return num.toLocaleString(undefined, formatOptions)
  }
}
