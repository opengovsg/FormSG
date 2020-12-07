'use strict'

const moment = require('moment-timezone')
const { get } = require('lodash')

angular.module('forms').component('dateFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-date.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    isValidateDate: '<',
  },
  controller: dateFieldComponentController,
  controllerAs: 'vm',
})

function dateFieldComponentController() {
  const vm = this

  vm.dateOptions = {
    showWeeks: false,
    formatMonth: 'MMM',
    yearRows: 4,
    yearColumns: 3,
    minDate: null,
    maxDate: null,
    initDate: null,
  }

  vm.$onChanges = (changesObj) => {
    if (changesObj.isValidateDate) {
      vm.dateOptions.minDate = null
      vm.dateOptions.maxDate = null
      const todayIsoFormat = moment
        .tz('Asia/Singapore')
        .format('YYYY/MM/DD HH:mm:ss')
      if (
        get(vm.field, 'dateValidation.selectedDateValidation') ===
        'Disallow past dates'
      ) {
        // Get GMT+8 time information from moment.tz
        // but convert it to JS date using the format string
        // as js date does not contain tz information
        vm.dateOptions.minDate = new Date(todayIsoFormat)
      }
      if (
        get(vm.field, 'dateValidation.selectedDateValidation') ===
        'Disallow future dates'
      ) {
        vm.dateOptions.maxDate = new Date(todayIsoFormat)
      }
      if (get(vm.field, 'dateValidation.customMinDate')) {
        vm.dateOptions.minDate = new Date(vm.field.dateValidation.customMinDate)
      }

      if (get(vm.field, 'dateValidation.customMaxDate')) {
        vm.dateOptions.maxDate = new Date(vm.field.dateValidation.customMaxDate)
      }

      // If minDate is set, default view upon opening datepicker to be month of minDate
      // Setting vm.dateOptions.initDate = vm.dateOptions.minDate directly leads to a bug
      // whereby after a date is selected on the datepicker,minDate is set to the start of
      // the month of the selected date.
      // This is possibly because init date is automatically updated to the month of
      // the latest date selection (did not find more details in documentation);
      // since object properties are passed by reference, this led to dateOptions.minDate
      // also being updated to the start of the selected month
      if (vm.dateOptions.minDate) {
        vm.dateOptions.initDate = new Date(vm.dateOptions.minDate)
      } else {
        vm.dateOptions.initDate = null
      }
    }
  }

  vm.isDateInvalid = () => {
    const date = vm.field.fieldValue ? moment(vm.field.fieldValue) : null
    const minDate = vm.dateOptions.minDate
      ? moment(vm.dateOptions.minDate).startOf('day')
      : null
    const maxDate = vm.dateOptions.maxDate
      ? moment(vm.dateOptions.maxDate).startOf('day')
      : null
    if (date && minDate && maxDate) {
      return date < minDate || date > maxDate
    }
    if (date && minDate) {
      return date < minDate
    }
    if (date && maxDate) {
      return date > maxDate
    }
    return false
  }
}
