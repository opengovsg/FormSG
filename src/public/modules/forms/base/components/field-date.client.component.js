'use strict'

const moment = require('moment-timezone')
const { get } = require('lodash')

angular.module('forms').component('dateFieldComponent', {
  templateUrl: 'modules/forms/base/componentViews/field-date.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    isValidateDate: '<'
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
  }

  vm.$onChanges = (changesObj) => {
    if (changesObj.isValidateDate) {
      vm.dateOptions.minDate = null
      vm.dateOptions.maxDate = null
      const todayIsoFormat = moment
        .tz('Asia/Singapore')
        .format('YYYY/MM/DD HH:mm:ss')
      if (get(vm.field, 'dateValidation.selectedDateValidation') === 'Disallow past dates') {
        // Get GMT+8 time information from moment.tz
        // but convert it to JS date using the format string
        // as js date does not contain tz information
        vm.dateOptions.minDate = new Date(todayIsoFormat)
      }
      if (get(vm.field, 'dateValidation.selectedDateValidation') === 'Disallow future dates') {
        vm.dateOptions.maxDate = new Date(todayIsoFormat)
      }
      if (get(vm.field, 'dateValidation.customMinDate')) {
        vm.dateOptions.minDate = new Date(vm.field.dateValidation.customMinDate)
      }

      if (get(vm.field, 'dateValidation.customMaxDate')) {
        vm.dateOptions.maxDate = new Date(vm.field.dateValidation.customMaxDate)
      }
    }
  }

  vm.isDateInvalid = () => {
    const date = vm.field.fieldValue ? moment(vm.field.fieldValue) : null
    const minDate = vm.dateOptions.minDate ? moment(vm.dateOptions.minDate).startOf('day') : null
    const maxDate = vm.dateOptions.maxDate ? moment(vm.dateOptions.maxDate).startOf('day') : null
    if (date && minDate && maxDate) {
      return date < minDate || date > maxDate
    } 
    if (date && minDate){
      return date < minDate
    } 
    if (date && maxDate) {
      return date > maxDate
    }
    return false
  }
}
